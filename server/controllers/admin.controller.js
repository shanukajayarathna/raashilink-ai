import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Match from '../models/Match.js';
import WeddingProject from '../models/WeddingProject.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

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

  const [userCount, vendorCount, matchCount, projects] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Vendor.countDocuments({}),
    Match.countDocuments({ createdAt: { $gte: startOfMonth } }),
    WeddingProject.find({}).select('totalBudget').lean(),
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
      .select('businessName createdAt verified')
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
      text: `Vendor \"${vendor.businessName || 'Vendor'}\" ${vendor.verified ? 'is verified' : 'joined the marketplace'}`,
      time: vendor.createdAt,
      status: vendor.verified ? 'success' : 'warning',
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
        { title: 'Matches This Month', value: matchCount.toLocaleString('en-US'), growth: 'Live', color: '#C9A84C' },
        { title: 'Revenue (LKR)', value: revenueValue.toLocaleString('en-US'), growth: 'Live', color: '#2E7D32' },
      ],
      growthData,
      recentActivity,
    },
  });
});

export default {
  getOverview,
};
