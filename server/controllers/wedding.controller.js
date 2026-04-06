import mongoose from 'mongoose';
import WeddingProject from '../models/WeddingProject.js';
import Vendor from '../models/Vendor.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

function ensureObjectId(id, field) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

function calculateBudget(project) {
  const totalSpent = (project.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  return {
    totalBudget: project.totalBudget,
    totalSpent,
    remainingBudget: Math.max(0, Number(project.totalBudget || 0) - totalSpent),
    expenses: project.expenses || [],
  };
}

async function getOrCreateProject(userId) {
  let project = await WeddingProject.findOne({ coupleUserIds: userId }).sort({ createdAt: -1 });

  if (!project) {
    project = await WeddingProject.create({
      coupleUserIds: [userId],
      weddingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      totalBudget: 0,
      expenses: [],
      checklist: [],
      vendors: [],
    });
  }

  return project;
}

export const getProject = asyncHandler(async (req, res) => {
  const project = await getOrCreateProject(req.user._id);

  res.status(200).json({
    success: true,
    data: project,
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await getOrCreateProject(req.user._id);
  const allowed = ['weddingDate', 'venueId', 'totalBudget'];

  for (const key of allowed) {
    if (req.body?.[key] !== undefined) {
      project[key] = req.body[key];
    }
  }

  if (project.venueId) {
    ensureObjectId(project.venueId, 'venueId');
  }

  await project.save();

  res.status(200).json({
    success: true,
    data: project,
  });
});

export const addTask = asyncHandler(async (req, res) => {
  const { title, dueDate, assignedTo } = req.body ?? {};
  if (!title) {
    throw new ApiError(400, 'Task title is required');
  }

  const project = await getOrCreateProject(req.user._id);
  project.checklist.push({
    title,
    dueDate,
    assignedTo,
    completed: false,
  });
  await project.save();

  res.status(201).json({
    success: true,
    data: project.checklist[project.checklist.length - 1],
  });
});

export const addExpense = asyncHandler(async (req, res) => {
  const { title, category, amount, dueDate, notes } = req.body ?? {};
  if (!title || !category || amount === undefined) {
    throw new ApiError(400, 'Expense title, category, and amount are required');
  }

  const project = await getOrCreateProject(req.user._id);
  project.expenses.push({
    title,
    category,
    amount: Number(amount),
    dueDate,
    notes,
    paid: false,
  });
  await project.save();

  res.status(201).json({
    success: true,
    data: calculateBudget(project),
  });
});

export const getBudget = asyncHandler(async (req, res) => {
  const project = await getOrCreateProject(req.user._id);

  res.status(200).json({
    success: true,
    data: calculateBudget(project),
  });
});

export const getWeddingVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({ verified: true })
    .sort({ 'ratings.average': -1 })
    .limit(20)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      items: vendors,
      total: vendors.length,
    },
  });
});

export const requestQuote = asyncHandler(async (req, res) => {
  const { vendorId, quotedAmount, category } = req.body ?? {};
  ensureObjectId(vendorId, 'vendorId');

  const vendor = await Vendor.findById(vendorId).lean();
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  const project = await getOrCreateProject(req.user._id);
  const existing = project.vendors.find((entry) => String(entry.vendorId) === String(vendorId));

  if (existing) {
    existing.status = 'requested';
    existing.category = category || existing.category;
    existing.quotedAmount = Number(quotedAmount || existing.quotedAmount || 0);
  } else {
    project.vendors.push({
      vendorId,
      category: category || vendor.category,
      quotedAmount: Number(quotedAmount || 0),
      status: 'requested',
    });
  }

  await project.save();

  res.status(201).json({
    success: true,
    data: {
      projectId: String(project._id),
      vendorId,
      status: 'requested',
    },
  });
});

export default {
  getProject,
  updateProject,
  addTask,
  addExpense,
  getBudget,
  getWeddingVendors,
  requestQuote,
};
