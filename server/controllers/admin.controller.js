import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Match from '../models/Match.js';
import WeddingProject from '../models/WeddingProject.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';

function requireAdmin(req) {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

export const getOverview = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [userCount, vendorCount, matchCount, projects, pendingVendors] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Vendor.countDocuments({ approvalStatus: 'approved' }),
    Match.countDocuments({ createdAt: { $gte: startOfMonth } }),
    WeddingProject.find({}).select('totalBudget').lean(),
    Vendor.countDocuments({ approvalStatus: 'pending' }),
  ]);

  const revenueValue = projects.reduce((sum, project) => sum + Number(project?.totalBudget || 0), 0);

  const growthData = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);

    const [registered, active] = await Promise.all([
      User.countDocuments({
        role: 'user',
        createdAt: { $gte: monthStart, $lt: monthEnd },
      }),
      User.countDocuments({
        role: 'user',
        'verification.emailVerified': true,
        createdAt: { $lt: monthEnd },
      }),
    ]);

    growthData.push({
      month: formatMonthLabel(monthStart),
      registered,
      active,
    });
  }

  const [recentUsers, recentVendors, recentMatches] = await Promise.all([
    User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('personalInfo.firstName personalInfo.lastName createdAt')
      .lean(),
    Vendor.find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .select('businessName createdAt verified approvalStatus')
      .lean(),
    Match.find({})
      .sort({ updatedAt: -1 })
      .limit(1)
      .select('compatibilityScore updatedAt')
      .lean(),
  ]);

  const recentActivity = [
    ...recentUsers.map((user, index) => ({
      id: `user-${index}`,
      type: 'user',
      text: `New user \"${[user.personalInfo?.firstName, user.personalInfo?.lastName].filter(Boolean).join(' ').trim() || 'User'}\" registered`,
      time: user.createdAt,
      status: 'success',
    })),
    ...recentVendors.map((vendor, index) => ({
      id: `vendor-${index}`,
      type: 'vendor',
      text: `Vendor \"${vendor.businessName || 'Vendor'}\" ${vendor.approvalStatus === 'pending' ? 'pending approval' : vendor.verified ? 'is verified' : 'joined the marketplace'}`,
      time: vendor.createdAt,
      status: vendor.approvalStatus === 'pending' ? 'warning' : vendor.verified ? 'success' : 'info',
    })),
    ...recentMatches.map((match, index) => ({
      id: `match-${index}`,
      type: 'match',
      text: `New compatibility result saved (${Math.round(Number(match.compatibilityScore || 0))}% score)`,
      time: match.updatedAt,
      status: 'success',
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 4)
    .map((item) => ({
      ...item,
      time: item.time ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(item.time)) : 'Recently',
    }));

  res.status(200).json({
    success: true,
    data: {
      kpis: [
        { title: 'Total Users', value: userCount.toLocaleString('en-US'), growth: 'Live', color: '#8B1A2E' },
        { title: 'Active Vendors', value: vendorCount.toLocaleString('en-US'), growth: 'Live', color: '#1A6B72' },
        { title: 'Pending Vendors', value: pendingVendors.toLocaleString('en-US'), growth: 'Live', color: '#ED6C02' },
        { title: 'Matches This Month', value: matchCount.toLocaleString('en-US'), growth: 'Live', color: '#C9A84C' },
        { title: 'Revenue (LKR)', value: revenueValue.toLocaleString('en-US'), growth: 'Live', color: '#2E7D32' },
      ],
      growthData,
      recentActivity,
    },
  });
});

export const getPendingVendors = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { page = 1, limit = 10, status = 'pending' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query.approvalStatus = status;
  }

  const [vendors, total] = await Promise.all([
    Vendor.find(query)
      .populate('userId', 'personalInfo.firstName personalInfo.lastName email personalInfo.phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Vendor.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: vendors.map((vendor) => ({
        id: String(vendor._id),
        businessName: vendor.businessName,
        category: vendor.category,
        businessRegistrationNumber: vendor.businessRegistrationNumber,
        socialLinks: vendor.socialLinks || {},
        documents: vendor.documents || [],
        approvalStatus: vendor.approvalStatus,
        adminNotes: vendor.adminNotes || '',
        ownerName: [vendor.userId?.personalInfo?.firstName, vendor.userId?.personalInfo?.lastName].filter(Boolean).join(' ') || 'N/A',
        ownerEmail: vendor.userId?.email || '',
        ownerPhone: vendor.userId?.personalInfo?.phone || '',
        createdAt: vendor.createdAt,
        approvalHistory: vendor.approvalHistory || [],
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getVendorDetail = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid vendor ID');
  }

  const vendor = await Vendor.findById(id)
    .populate('userId', 'personalInfo email phone')
    .lean();

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  res.status(200).json({
    success: true,
    data: vendor,
  });
});

export const approveVendor = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { id } = req.params;
  const { notes } = req.body ?? {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid vendor ID');
  }

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.approvalStatus = 'approved';
  vendor.verified = true;
  vendor.verificationDate = new Date();
  vendor.adminNotes = notes?.trim() || '';

  vendor.approvalHistory = vendor.approvalHistory || [];
  vendor.approvalHistory.push({
    status: 'approved',
    changedBy: req.user._id,
    changedAt: new Date(),
    reason: notes?.trim() || 'Vendor approved by admin',
  });

  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Vendor approved successfully',
    data: {
      id: String(vendor._id),
      approvalStatus: vendor.approvalStatus,
      verified: vendor.verified,
    },
  });
});

export const rejectVendor = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { id } = req.params;
  const { reason } = req.body ?? {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid vendor ID');
  }

  if (!reason?.trim()) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.approvalStatus = 'rejected';
  vendor.adminNotes = reason.trim();

  vendor.approvalHistory = vendor.approvalHistory || [];
  vendor.approvalHistory.push({
    status: 'rejected',
    changedBy: req.user._id,
    changedAt: new Date(),
    reason: reason.trim(),
  });

  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Vendor rejected',
    data: {
      id: String(vendor._id),
      approvalStatus: vendor.approvalStatus,
    },
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { page = 1, limit = 10, role = 'user', search = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = { role: role || 'user' };
  if (search?.trim()) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('email personalInfo verification createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: users.map((user) => ({
        id: String(user._id),
        email: user.email,
        name: [user.personalInfo?.firstName, user.personalInfo?.lastName].filter(Boolean).join(' ') || 'N/A',
        emailVerified: user.verification?.emailVerified || false,
        phoneVerified: user.verification?.phoneVerified || false,
        registeredAt: user.createdAt,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getMatches = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [matches, total] = await Promise.all([
    Match.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Match.countDocuments({}),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: matches.map((match) => ({
        id: String(match._id),
        compatibilityScore: match.compatibilityScore || 0,
        createdAt: match.createdAt,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getWeddingProjects = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [projects, total] = await Promise.all([
    WeddingProject.find({})
      .select('weddingDate totalBudget status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    WeddingProject.countDocuments({}),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: projects.map((project) => ({
        id: String(project._id),
        weddingDate: project.weddingDate,
        totalBudget: project.totalBudget || 0,
        status: project.status || 'planning',
        createdAt: project.createdAt,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    newUsersThisMonth,
    totalVendors,
    pendingVendors,
    approvedVendors,
    totalMatches,
    totalProjects,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } }),
    Vendor.countDocuments({}),
    Vendor.countDocuments({ approvalStatus: 'pending' }),
    Vendor.countDocuments({ approvalStatus: 'approved' }),
    Match.countDocuments({}),
    WeddingProject.countDocuments({}),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      vendors: {
        total: totalVendors,
        pending: pendingVendors,
        approved: approvedVendors,
      },
      matches: totalMatches,
      projects: totalProjects,
    },
  });
});

export default {
  getOverview,
  getPendingVendors,
  getVendorDetail,
  approveVendor,
  rejectVendor,
  getUsers,
  getMatches,
  getWeddingProjects,
  getAnalytics,
};
