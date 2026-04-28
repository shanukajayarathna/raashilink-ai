import mongoose from 'mongoose';
import WeddingProject from '../models/WeddingProject.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../lib/socket.js';
import Vendor from '../models/Vendor.js';
import QuoteRequest from '../models/QuoteRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

function ensureObjectId(id, field) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

function notifyPartner(project, currentUserId, type = null) {
  if (!Array.isArray(project.coupleUserIds) || project.coupleUserIds.length < 2) return;
  const partnerId = project.coupleUserIds.find((id) => String(id) !== String(currentUserId));
  if (partnerId) {
    emitToUser(partnerId, 'wedding_updated', { projectId: String(project._id), type });
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
  await project.populate({ path: 'venueId', select: 'businessName city address serviceArea category' });
  await project.populate({ path: 'vendors.vendorId', select: 'businessName city category serviceArea pricingRange portfolioImages' });

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
  notifyPartner(project, req.user._id, 'project');

  res.status(200).json({
    success: true,
    data: project,
  });
});

export const addTask = asyncHandler(async (req, res) => {
  const { title, category, dueDate, assignedTo } = req.body ?? {};
  if (!title) {
    throw new ApiError(400, 'Task title is required');
  }

  const project = await getOrCreateProject(req.user._id);
  project.checklist.push({
    title,
    category,
    dueDate,
    assignedTo,
    completed: false,
  });
  await project.save();
  notifyPartner(project, req.user._id, 'checklist');

  res.status(201).json({
    success: true,
    data: project.checklist[project.checklist.length - 1],
  });
});

export const updateTask = asyncHandler(async (req, res) => {
  const { index } = req.params;
  const idx = Number(index);
  const { title, category, dueDate, assignedTo, completed } = req.body ?? {};
  const project = await getOrCreateProject(req.user._id);

  if (isNaN(idx) || idx < 0 || idx >= project.checklist.length) {
    throw new ApiError(400, 'Invalid task index');
  }

  const task = project.checklist[idx];
  if (title !== undefined) {
    if (!String(title).trim()) throw new ApiError(400, 'Task title is required');
    task.title = String(title).trim();
  }
  if (category !== undefined) task.category = category;
  if (dueDate !== undefined) task.dueDate = dueDate || undefined;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  if (completed !== undefined) task.completed = Boolean(completed);

  await project.save();
  notifyPartner(project, req.user._id, 'checklist');

  res.status(200).json({
    success: true,
    data: {
      item: project.checklist[idx],
      checklist: project.checklist,
    },
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { index } = req.params;
  const idx = Number(index);
  const project = await getOrCreateProject(req.user._id);

  if (isNaN(idx) || idx < 0 || idx >= project.checklist.length) {
    throw new ApiError(400, 'Invalid task index');
  }

  project.checklist.splice(idx, 1);
  await project.save();
  notifyPartner(project, req.user._id, 'checklist');

  res.status(200).json({
    success: true,
    data: {
      checklist: project.checklist,
    },
  });
});

export const addExpense = asyncHandler(async (req, res) => {
  const { title, category, amount, dueDate, notes, paid } = req.body ?? {};
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
    paid: Boolean(paid),
  });
  await project.save();
  notifyPartner(project, req.user._id, 'budget');

  res.status(201).json({
    success: true,
    data: calculateBudget(project),
  });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const { index } = req.params;
  const idx = Number(index);
  const { title, category, amount, notes, paid } = req.body ?? {};

  const project = await getOrCreateProject(req.user._id);
  if (idx < 0 || idx >= project.expenses.length) throw new ApiError(404, 'Expense not found');

  const expense = project.expenses[idx];
  if (title !== undefined) expense.title = title;
  if (category !== undefined) expense.category = category;
  if (amount !== undefined) expense.amount = Number(amount);
  if (notes !== undefined) expense.notes = notes;
  if (paid !== undefined) expense.paid = Boolean(paid);

  await project.save();
  notifyPartner(project, req.user._id, 'budget');
  res.status(200).json({ success: true, data: calculateBudget(project) });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const { index } = req.params;
  const idx = Number(index);

  const project = await getOrCreateProject(req.user._id);
  if (idx < 0 || idx >= project.expenses.length) throw new ApiError(404, 'Expense not found');

  project.expenses.splice(idx, 1);
  await project.save();
  notifyPartner(project, req.user._id, 'budget');
  res.status(200).json({ success: true, data: calculateBudget(project) });
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
    .limit(100)
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
  const {
    vendorId,
    quotedAmount,
    category,
    eventType,
    weddingDate,
    guestCount,
    location,
    venueName,
    preferredPackage,
    coverageHours,
    budgetMin,
    budgetMax,
    requirements,
    contactName,
    contactEmail,
    contactPhone,
    preferredContactMethod,
  } = req.body ?? {};
  ensureObjectId(vendorId, 'vendorId');

  const vendor = await Vendor.findById(vendorId).lean();
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  const requestWeddingDate = weddingDate || undefined;
  const parsedBudgetMin = Number(budgetMin || 0);
  const parsedBudgetMax = Number(budgetMax || quotedAmount || 0);
  const project = await getOrCreateProject(req.user._id);
  const requesterName = req.user?.name || [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || 'RaashiLink Couple';
  const quoteRequest = await QuoteRequest.create({
    vendorId: vendor._id,
    vendorUserId: vendor.userId,
    requesterUserId: req.user._id,
    projectId: project._id,
    category: category || vendor.category,
    requestDetails: {
      eventType: eventType || 'Wedding',
      weddingDate: requestWeddingDate || project.weddingDate,
      guestCount: Number(guestCount || 0),
      location: location || venueName || req.user?.location || '',
      venueName: venueName || '',
      preferredPackage: preferredPackage || '',
      coverageHours: Number(coverageHours || 0),
      budgetRange: {
        min: parsedBudgetMin,
        max: parsedBudgetMax,
        currency: 'LKR',
      },
      contactName: contactName || requesterName,
      contactEmail: contactEmail || req.user?.email || '',
      contactPhone: contactPhone || req.user?.phone || '',
      preferredContactMethod: preferredContactMethod || 'platform',
      requirements: requirements || '',
    },
  });
  const existing = project.vendors.find((entry) => String(entry.vendorId) === String(vendorId));

  if (existing) {
    existing.status = 'requested';
    existing.category = category || existing.category;
    existing.quotedAmount = Number(quotedAmount || existing.quotedAmount || parsedBudgetMax || 0);
    existing.quoteRequestId = quoteRequest._id;
    existing.requestedAt = new Date();
    existing.vendorName = vendor.businessName;
    existing.notes = requirements || existing.notes || '';
  } else {
    project.vendors.push({
      vendorId,
      category: category || vendor.category,
      quotedAmount: Number(quotedAmount || parsedBudgetMax || 0),
      quoteRequestId: quoteRequest._id,
      requestedAt: new Date(),
      vendorName: vendor.businessName,
      notes: requirements || '',
      status: 'requested',
    });
  }

  await project.save();
  notifyPartner(project, req.user._id, 'vendor');

  res.status(201).json({
    success: true,
    data: {
      projectId: String(project._id),
      vendorId,
      quoteRequestId: String(quoteRequest._id),
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
  const vendor = await Vendor.findById(vendorId).select('category businessName').lean();
  if (status === 'booked' && vendor?.category === 'Venue') {
    project.venueId = vendorId;
  }
  if (status === 'cancelled' && String(project.venueId || '') === String(vendorId)) {
    project.venueId = undefined;
  }
  await project.save();
  notifyPartner(project, req.user._id, 'vendor');

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
  notifyPartner(project, req.user._id, 'checklist');

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
  const inviter = await User.findById(req.user._id)
    .select('personalInfo.firstName personalInfo.lastName personalInfo.profilePic name profilePic')
    .lean();
  const inviterName =
    [inviter?.personalInfo?.firstName, inviter?.personalInfo?.lastName].filter(Boolean).join(' ') ||
    inviter?.name ||
    'Someone';
  const notif = await Notification.create({
    userId: partnerId,
    type: 'wedding_invite',
    fromUserId: req.user._id,
    fromUserName: inviterName,
    fromUserProfilePic: inviter?.personalInfo?.profilePic || inviter?.profilePic || null,
    metadata: { inviterId: String(req.user._id) },
  });
  emitToUser(partnerId, 'notification', {
    id: String(notif._id),
    type: 'wedding_invite',
    fromUserId: String(req.user._id),
    fromUserName: inviterName,
    fromUserProfilePic: inviter?.personalInfo?.profilePic || inviter?.profilePic || null,
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
  const acceptor = await User.findById(req.user._id)
    .select('personalInfo.firstName personalInfo.lastName personalInfo.profilePic name profilePic')
    .lean();
  const acceptorName =
    [acceptor?.personalInfo?.firstName, acceptor?.personalInfo?.lastName].filter(Boolean).join(' ') ||
    acceptor?.name ||
    'Your match';

  const notif = await Notification.create({
    userId: inviterId,
    type: 'wedding_accepted',
    fromUserId: req.user._id,
    fromUserName: acceptorName,
    fromUserProfilePic: acceptor?.personalInfo?.profilePic || acceptor?.profilePic || null,
    metadata: { acceptorId: String(req.user._id) },
  });
  emitToUser(inviterId, 'notification', {
    id: String(notif._id),
    type: 'wedding_accepted',
    fromUserId: String(req.user._id),
    fromUserName: acceptorName,
    fromUserProfilePic: acceptor?.personalInfo?.profilePic || acceptor?.profilePic || null,
    metadata: { acceptorId: String(req.user._id) },
    read: false,
    createdAt: notif.createdAt,
  });
  // Let the inviter's WeddingDashboard refresh immediately
  emitToUser(inviterId, 'wedding_accepted', { acceptorId: String(req.user._id), acceptorName });
  // Also notify the acceptor so their MessagesPage updates to 'coupled' in real-time
  emitToUser(String(req.user._id), 'wedding_accepted', { acceptorId: String(req.user._id), acceptorName });

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
  }).populate({ path: 'coupleUserIds', select: 'personalInfo.firstName personalInfo.lastName personalInfo.profilePic name profilePic' });

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
      inviterName:
        [inviter?.personalInfo?.firstName, inviter?.personalInfo?.lastName].filter(Boolean).join(' ') ||
        inviter?.name ||
        'Your match',
      inviterProfilePic: inviter?.personalInfo?.profilePic || inviter?.profilePic || null,
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
  updateTask,
  deleteTask,
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
