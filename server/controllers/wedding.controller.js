import mongoose from 'mongoose';
import WeddingProject from '../models/WeddingProject.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../lib/socket.js';
import Vendor from '../models/Vendor.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

function ensureObjectId(id, field) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

function notifyPartner(project, currentUserId) {
  if (!Array.isArray(project.coupleUserIds) || project.coupleUserIds.length < 2) return;
  const partnerId = project.coupleUserIds.find((id) => String(id) !== String(currentUserId));
  if (partnerId) {
    emitToUser(partnerId, 'wedding_updated', { projectId: String(project._id) });
  }
}

/**
 * Fully resets wedding projects for two users:
 * - Deletes any shared/coupled project and any solo projects for both users
 * - Creates two fresh blank solo projects (one per user)
 * - Cleans up all wedding notifications between the pair
 * - Emits wedding_reset to both users
 */
export async function resetBothWeddingProjects(userIdA, userIdB) {
  const freshDate = () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);

  // Delete ALL existing projects that involve either user
  await WeddingProject.deleteMany({
    coupleUserIds: { $in: [userIdA, userIdB] },
  });

  // Clean up all wedding-related notifications between the two users
  await Notification.deleteMany({
    $or: [
      { userId: userIdA, fromUserId: userIdB, type: { $in: ['wedding_invite', 'wedding_accepted'] } },
      { userId: userIdB, fromUserId: userIdA, type: { $in: ['wedding_invite', 'wedding_accepted'] } },
    ],
  });

  // Create fresh blank projects for each user
  await WeddingProject.create([
    { coupleUserIds: [userIdA], weddingDate: freshDate(), totalBudget: 0, expenses: [], checklist: [], vendors: [] },
    { coupleUserIds: [userIdB], weddingDate: freshDate(), totalBudget: 0, expenses: [], checklist: [], vendors: [] },
  ]);

  // Notify both users so their dashboards refresh
  emitToUser(String(userIdA), 'wedding_reset', { message: 'Wedding project has been reset' });
  emitToUser(String(userIdB), 'wedding_reset', { message: 'Wedding project has been reset' });
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
  // Select 'personalInfo' (real DB field) so virtuals (firstName, lastName, profilePic) are computed on serialisation
  await project.populate({ path: 'coupleUserIds', select: 'personalInfo' });

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
  notifyPartner(project, req.user._id);

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
  notifyPartner(project, req.user._id);

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
  notifyPartner(project, req.user._id);

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
  notifyPartner(project, req.user._id);

  res.status(201).json({
    success: true,
    data: {
      projectId: String(project._id),
      vendorId,
      status: 'requested',
    },
  });
});

export const updateVendorStatus = asyncHandler(async (req, res) => {
  const { vendorId, status } = req.body ?? {};
  ensureObjectId(vendorId, 'vendorId');
  const allowedStatuses = ['shortlisted', 'requested', 'booked', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const project = await getOrCreateProject(req.user._id);
  const entry = project.vendors.find((v) => String(v.vendorId) === String(vendorId));
  if (!entry) {
    throw new ApiError(404, 'Vendor not found in project');
  }
  entry.status = status;
  await project.save();
  notifyPartner(project, req.user._id);

  res.status(200).json({ success: true, data: { vendorId, status } });
});

export const toggleTask = asyncHandler(async (req, res) => {
  const { index } = req.params;
  const idx = Number(index);
  const project = await getOrCreateProject(req.user._id);

  if (isNaN(idx) || idx < 0 || idx >= project.checklist.length) {
    throw new ApiError(400, 'Invalid task index');
  }

  project.checklist[idx].completed = !project.checklist[idx].completed;
  await project.save();
  notifyPartner(project, req.user._id);

  res.status(200).json({ success: true, data: project.checklist[idx] });
});

export const invitePartner = asyncHandler(async (req, res) => {
  const { partnerId } = req.body ?? {};
  if (!partnerId) throw new ApiError(400, 'partnerId is required');
  ensureObjectId(partnerId, 'partnerId');

  if (String(partnerId) === String(req.user._id)) {
    throw new ApiError(400, 'Cannot invite yourself');
  }

  const project = await getOrCreateProject(req.user._id);

  // Already linked
  if (project.coupleUserIds.some((id) => String(id) === String(partnerId))) {
    return res.status(200).json({ success: true, message: 'Partner already linked', data: project });
  }

  project.pendingInvite = { inviteeId: partnerId, status: 'pending' };
  await project.save();

  // Send notification to partner
  const inviter = await User.findById(req.user._id).select('firstName lastName name profilePic').lean();
  const inviterName = inviter?.firstName || inviter?.name || 'Someone';
  const notif = await Notification.create({
    userId: partnerId,
    type: 'wedding_invite',
    fromUserId: req.user._id,
    fromUserName: inviterName,
    fromUserProfilePic: inviter?.profilePic || null,
    metadata: { inviterId: String(req.user._id) },
  });
  emitToUser(partnerId, 'notification', {
    id: String(notif._id),
    type: 'wedding_invite',
    fromUserId: String(req.user._id),
    fromUserName: inviterName,
    fromUserProfilePic: inviter?.profilePic || null,
    metadata: { inviterId: String(req.user._id) },
    read: false,
    createdAt: notif.createdAt,
  });
  // Let the invitee's WeddingDashboard refresh immediately
  emitToUser(partnerId, 'wedding_invite', { inviterId: String(req.user._id), inviterName });

  res.status(200).json({
    success: true,
    message: 'Invitation sent',
    data: { projectId: String(project._id), inviteeId: partnerId },
  });
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const { inviterId } = req.body ?? {};
  if (!inviterId) throw new ApiError(400, 'inviterId is required');
  ensureObjectId(inviterId, 'inviterId');

  // Find the inviter's project that has a pending invite for this user
  const inviterProject = await WeddingProject.findOne({
    coupleUserIds: inviterId,
    'pendingInvite.inviteeId': req.user._id,
    'pendingInvite.status': 'pending',
  });

  if (!inviterProject) {
    throw new ApiError(404, 'No pending invitation found from this user');
  }

  // Link both users into the inviter's project
  if (!inviterProject.coupleUserIds.some((id) => String(id) === String(req.user._id))) {
    inviterProject.coupleUserIds.push(req.user._id);
  }
  inviterProject.pendingInvite.status = 'accepted';
  await inviterProject.save();

  // Remove or reassign the acceptor's separate solo project if it exists
  await WeddingProject.deleteMany({
    coupleUserIds: req.user._id,
    _id: { $ne: inviterProject._id },
  });

  // Notify the inviter that their invite was accepted
  const acceptor = await User.findById(req.user._id).select('firstName lastName name profilePic').lean();
  const acceptorName = acceptor?.firstName || acceptor?.name || 'Your match';

  const notif = await Notification.create({
    userId: inviterId,
    type: 'wedding_accepted',
    fromUserId: req.user._id,
    fromUserName: acceptorName,
    fromUserProfilePic: acceptor?.profilePic || null,
    metadata: { acceptorId: String(req.user._id) },
  });
  emitToUser(inviterId, 'notification', {
    id: String(notif._id),
    type: 'wedding_accepted',
    fromUserId: String(req.user._id),
    fromUserName: acceptorName,
    fromUserProfilePic: acceptor?.profilePic || null,
    metadata: { acceptorId: String(req.user._id) },
    read: false,
    createdAt: notif.createdAt,
  });
  // Let the inviter's WeddingDashboard refresh immediately
  emitToUser(inviterId, 'wedding_accepted', { acceptorId: String(req.user._id), acceptorName });

  res.status(200).json({
    success: true,
    message: 'Invitation accepted — wedding project shared!',
    data: inviterProject,
  });
});

// GET /wedding/couple/pending-invite — check if current user has a pending invite from anyone
export const getPendingInvite = asyncHandler(async (req, res) => {
  const project = await WeddingProject.findOne({
    'pendingInvite.inviteeId': req.user._id,
    'pendingInvite.status': 'pending',
  }).populate({ path: 'coupleUserIds', select: 'personalInfo' });

  if (!project) {
    return res.status(200).json({ success: true, data: null });
  }

  const inviter = project.coupleUserIds.find(
    (u) => u && typeof u === 'object' && String(u._id) !== String(req.user._id)
  ) || project.coupleUserIds[0];

  res.status(200).json({
    success: true,
    data: {
      inviterId: String(inviter?._id || project.coupleUserIds[0]),
      inviterName: inviter?.firstName || inviter?.name || 'Your match',
      inviterProfilePic: inviter?.profilePic || null,
      projectId: String(project._id),
    },
  });
});

// POST /wedding/couple/reset
// Handles 3 cases:
//   1. Inviter cancels a pending outgoing invite
//   2. Either partner dissolves a coupled project
//   3. Invitee formally declines an incoming invite
export const resetWedding = asyncHandler(async (req, res) => {
  // --- Case 3: current user is the invitee wanting to decline ---
  const inviteeProject = await WeddingProject.findOne({
    'pendingInvite.inviteeId': req.user._id,
    'pendingInvite.status': 'pending',
  });
  if (inviteeProject) {
    const inviterId = inviteeProject.coupleUserIds.find(
      (id) => String(id) !== String(req.user._id)
    ) || inviteeProject.coupleUserIds[0];
    inviteeProject.pendingInvite.status = 'declined';
    await inviteeProject.save();

    await Notification.deleteMany({
      $or: [
        { userId: req.user._id, fromUserId: inviterId, type: 'wedding_invite' },
        { userId: inviterId, fromUserId: req.user._id, type: { $in: ['wedding_invite', 'wedding_accepted'] } },
      ],
    });
    if (inviterId) {
      emitToUser(inviterId, 'wedding_reset', { message: 'Your wedding invitation was declined' });
    }
    return res.status(200).json({ success: true, message: 'Invitation declined' });
  }

  // --- Cases 1 & 2: current user owns/is in a project ---
  const project = await WeddingProject.findOne({ coupleUserIds: req.user._id });
  if (!project) {
    return res.status(200).json({ success: true, message: 'No wedding project to reset' });
  }

  const isCoupled = project.coupleUserIds.length >= 2;
  const hasPendingInvite = project.pendingInvite?.status === 'pending';

  const partnerId = isCoupled
    ? project.coupleUserIds.find((id) => String(id) !== String(req.user._id))
    : hasPendingInvite
    ? project.pendingInvite.inviteeId
    : null;

  if (isCoupled) {
    // Both users get fresh blank projects
    await resetBothWeddingProjects(req.user._id, partnerId);
    // resetBothWeddingProjects already emits wedding_reset to both, so we can return early
    return res.status(200).json({ success: true, message: 'Wedding project reset successfully' });
  } else {
    // Inviter cancels pending invite
    project.pendingInvite = { inviteeId: null, status: 'declined' };
    await project.save();
  }

  // Clean up wedding notifications and notify partner
  if (partnerId) {
    await Notification.deleteMany({
      $or: [
        { userId: req.user._id, fromUserId: partnerId, type: { $in: ['wedding_invite', 'wedding_accepted'] } },
        { userId: partnerId, fromUserId: req.user._id, type: { $in: ['wedding_invite', 'wedding_accepted'] } },
      ],
    });
    const resetter = await User.findById(req.user._id).select('firstName lastName name').lean();
    const resetterName = resetter?.firstName || resetter?.name || 'Your match';
    emitToUser(partnerId, 'wedding_reset', {
      resetterName,
      message: `${resetterName} has cancelled the wedding invite`,
    });
  }

  res.status(200).json({ success: true, message: 'Wedding project reset successfully' });
});

export default {
  getProject,
  updateProject,
  addTask,
  addExpense,
  getBudget,
  getWeddingVendors,
  requestQuote,
  updateVendorStatus,
  toggleTask,
  invitePartner,
  acceptInvite,
  getPendingInvite,
  resetWedding,
};

