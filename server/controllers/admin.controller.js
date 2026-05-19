import bcrypt from 'bcrypt';
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

function getDisplayName(user) {
  return [user?.personalInfo?.firstName, user?.personalInfo?.lastName].filter(Boolean).join(' ').trim() || 'N/A';
}

function getUserStatus(user) {
  return user?.verification?.emailVerified ? 'active' : 'unverified';
}

function normalizeAdminEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function normalizeAdminPhone(value = '') {
  return String(value || '').replace(/\D/g, '').replace(/^94/, '0').replace(/^0?/, '0');
}

export const getOverview = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    userCount,
    vendorCount,
    matchCountThisMonth,
    totalMatches,
    projects,
    totalProjects,
    pendingVendors,
    horoscopeSeekerTotal,
    horoscopeSeekersThisMonth,
    horoscopeSeekersLastMonth,
    coupleTotal,
    couplesThisMonth,
    couplesLastMonth,
    partnerTotal,
    partnersThisMonth,
    partnersLastMonth,
    mutualMatchesTotal,
    mutualMatchesThisMonth,
    mutualMatchesLastMonth,
    verifiedUsersTotal,
    verifiedUsersThisMonth,
    verifiedUsersLastMonth,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Vendor.countDocuments({ approvalStatus: 'approved' }),
    Match.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Match.countDocuments({}),
    WeddingProject.find({}).select('totalBudget').lean(),
    WeddingProject.countDocuments({}),
    Vendor.countDocuments({ approvalStatus: 'pending' }),
    User.countDocuments({ role: 'user', userType: 'horoscope_seeker' }),
    User.countDocuments({ role: 'user', userType: 'horoscope_seeker', createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'user', userType: 'horoscope_seeker', createdAt: { $gte: startOfPreviousMonth, $lt: startOfMonth } }),
    User.countDocuments({ role: 'user', userType: 'couple' }),
    User.countDocuments({ role: 'user', userType: 'couple', createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'user', userType: 'couple', createdAt: { $gte: startOfPreviousMonth, $lt: startOfMonth } }),
    User.countDocuments({ role: 'user', userType: 'partner' }),
    User.countDocuments({ role: 'user', userType: 'partner', createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'user', userType: 'partner', createdAt: { $gte: startOfPreviousMonth, $lt: startOfMonth } }),
    Match.countDocuments({ mutualInterest: true }),
    Match.countDocuments({ mutualInterest: true, createdAt: { $gte: startOfMonth } }),
    Match.countDocuments({ mutualInterest: true, createdAt: { $gte: startOfPreviousMonth, $lt: startOfMonth } }),
    User.countDocuments({ role: 'user', 'verification.emailVerified': true }),
    User.countDocuments({ role: 'user', 'verification.emailVerified': true, createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'user', 'verification.emailVerified': true, createdAt: { $gte: startOfPreviousMonth, $lt: startOfMonth } }),
  ]);

  const horoscopeSeekerGrowthDelta = horoscopeSeekersThisMonth - horoscopeSeekersLastMonth;
  const horoscopeSeekerGrowthLabel = `${horoscopeSeekerGrowthDelta >= 0 ? '+' : ''}${horoscopeSeekerGrowthDelta} this month`;

  const coupleGrowthDelta = couplesThisMonth - couplesLastMonth;
  const coupleGrowthLabel = `${coupleGrowthDelta >= 0 ? '+' : ''}${coupleGrowthDelta} this month`;

  const partnerGrowthDelta = partnersThisMonth - partnersLastMonth;
  const partnerGrowthLabel = `${partnerGrowthDelta >= 0 ? '+' : ''}${partnerGrowthDelta} this month`;

  const mutualMatchesGrowthDelta = mutualMatchesThisMonth - mutualMatchesLastMonth;
  const mutualMatchesGrowthLabel = `${mutualMatchesGrowthDelta >= 0 ? '+' : ''}${mutualMatchesGrowthDelta} this month`;

  const verifiedUsersGrowthDelta = verifiedUsersThisMonth - verifiedUsersLastMonth;
  const verifiedUsersGrowthLabel = `${verifiedUsersGrowthDelta >= 0 ? '+' : ''}${verifiedUsersGrowthDelta} this month`;

  const revenueValue = projects.reduce((sum, project) => sum + Number(project?.totalBudget || 0), 0);

  // Generate 6 Months Growth Data
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

  // Generate 6 Months Match Trends
  const matchGrowthData = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);

    const matchesCount = await Match.countDocuments({
      createdAt: { $gte: monthStart, $lt: monthEnd },
    });

    matchGrowthData.push({
      month: formatMonthLabel(monthStart),
      matches: matchesCount,
    });
  }

  // Generate 30 Days Daily Datasets (User Growth & Match Trends)
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [usersLast30Days, matchesLast30Days] = await Promise.all([
    User.find({
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo }
    }).select('createdAt verification.emailVerified').lean(),
    Match.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).select('createdAt').lean()
  ]);

  const dailyGrowthData = [];
  const dailyMatchData = [];
  const dailyMap = {};

  for (let offset = 29; offset >= 0; offset -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    day.setHours(0, 0, 0, 0);
    const key = day.toDateString();
    const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[key] = {
      date: label,
      registered: 0,
      active: 0,
      matches: 0
    };
  }

  usersLast30Days.forEach(user => {
    const userDate = new Date(user.createdAt);
    userDate.setHours(0, 0, 0, 0);
    const key = userDate.toDateString();
    if (dailyMap[key]) {
      dailyMap[key].registered += 1;
      if (user.verification?.emailVerified) {
        dailyMap[key].active += 1;
      }
    }
  });

  matchesLast30Days.forEach(match => {
    const matchDate = new Date(match.createdAt);
    matchDate.setHours(0, 0, 0, 0);
    const key = matchDate.toDateString();
    if (dailyMap[key]) {
      dailyMap[key].matches += 1;
    }
  });

  Object.keys(dailyMap).forEach(key => {
    dailyGrowthData.push({
      date: dailyMap[key].date,
      registered: dailyMap[key].registered,
      active: dailyMap[key].active
    });
    dailyMatchData.push({
      date: dailyMap[key].date,
      matches: dailyMap[key].matches
    });
  });

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
      text: `New user "${[user.personalInfo?.firstName, user.personalInfo?.lastName].filter(Boolean).join(' ').trim() || 'User'}" registered`,
      time: user.createdAt,
      status: 'success',
    })),
    ...recentVendors.map((vendor, index) => ({
      id: `vendor-${index}`,
      type: 'vendor',
      text: `Vendor "${vendor.businessName || 'Vendor'}" ${vendor.approvalStatus === 'pending' ? 'pending approval' : vendor.verified ? 'is verified' : 'joined the marketplace'}`,
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
      generatedAt: now.toISOString(),
      summary: {
        totalUsers: userCount,
        activeVendors: vendorCount,
        pendingVendors,
        horoscopeSeekerTotal,
        horoscopeSeekerGrowthDelta,
        coupleTotal,
        coupleGrowthDelta,
        partnerTotal,
        partnerGrowthDelta,
        mutualMatchesTotal,
        mutualMatchesGrowthDelta,
        verifiedUsersTotal,
        verifiedUsersGrowthDelta,
        matchesThisMonth: matchCountThisMonth,
        totalMatches,
        totalProjects,
        revenueValue,
      },
      kpis: [
        { title: 'Total Users', value: userCount.toLocaleString('en-US'), growth: 'Live', color: '#8B1A2E' },
        {
          title: 'Horoscope Seekers',
          value: horoscopeSeekerTotal.toLocaleString('en-US'),
          growth: horoscopeSeekerGrowthLabel,
          color: '#A16207',
        },
        {
          title: 'Couples',
          value: coupleTotal.toLocaleString('en-US'),
          growth: coupleGrowthLabel,
          color: '#EC4899',
        },
        {
          title: 'Partners',
          value: partnerTotal.toLocaleString('en-US'),
          growth: partnerGrowthLabel,
          color: '#3B82F6',
        },
        { title: 'Active Vendors', value: vendorCount.toLocaleString('en-US'), growth: 'Live', color: '#1A6B72' },
        { title: 'Pending Vendors', value: pendingVendors.toLocaleString('en-US'), growth: 'Live', color: '#ED6C02' },
        {
          title: 'Verified Users',
          value: verifiedUsersTotal.toLocaleString('en-US'),
          growth: verifiedUsersGrowthLabel,
          color: '#10B981',
        },
        {
          title: 'Mutual Matches',
          value: mutualMatchesTotal.toLocaleString('en-US'),
          growth: mutualMatchesGrowthLabel,
          color: '#8B5CF6',
        },
        { title: 'Matches This Month', value: matchCountThisMonth.toLocaleString('en-US'), growth: 'Live', color: '#C9A84C' },
        { title: 'Total Matches', value: totalMatches.toLocaleString('en-US'), growth: 'Live', color: '#6A1B9A' },
        { title: 'Wedding Projects', value: totalProjects.toLocaleString('en-US'), growth: 'Live', color: '#1565C0' },
        { title: 'Revenue (LKR)', value: revenueValue.toLocaleString('en-US'), growth: 'Live', color: '#2E7D32' },
      ],
      growthData,
      dailyGrowthData,
      matchGrowthData,
      dailyMatchData,
      recentActivity,
    },
  });
});

export const createAdminUser = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
  } = req.body ?? {};

  const normalizedEmail = normalizeAdminEmail(email);
  const normalizedPhone = normalizeAdminPhone(phone);

  if (!normalizedEmail || !password || !firstName?.trim() || !lastName?.trim() || !normalizedPhone) {
    throw new ApiError(400, 'Email, password, first name, last name, and phone are required');
  }

  if (String(password).trim().length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new ApiError(400, 'Enter a valid email address');
  }

  if (!/^07\d{8}$/.test(normalizedPhone)) {
    throw new ApiError(400, 'Enter a valid Sri Lankan mobile number');
  }

  const existingUser = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { 'personalInfo.phone': `+94${normalizedPhone.slice(1)}` },
    ],
  }).lean();

  if (existingUser) {
    throw new ApiError(409, 'A user with this email or phone already exists');
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const adminUser = await User.create({
    email: normalizedEmail,
    passwordHash,
    role: 'admin',
    personalInfo: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phone: `+94${normalizedPhone.slice(1)}`,
      location: 'Sri Lanka',
    },
    verification: {
      emailVerified: true,
      phoneVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });

  res.status(201).json({
    success: true,
    message: 'Admin user created successfully',
    data: {
      id: String(adminUser._id),
      email: adminUser.email,
      role: adminUser.role,
      name: getDisplayName(adminUser),
      status: getUserStatus(adminUser),
      registeredAt: adminUser.createdAt,
    },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  if (String(req.user?._id) === id) {
    throw new ApiError(400, 'You cannot delete your own admin account');
  }

  const user = await User.findById(id).select('role');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new ApiError(400, 'At least one admin account must remain');
    }
  }

  await Promise.all([
    User.deleteOne({ _id: id }),
    Vendor.deleteMany({ userId: id }),
  ]);

  res.status(200).json({
    success: true,
    message: 'User removed successfully',
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
        verified: vendor.verified,
        adminNotes: vendor.adminNotes || '',
        ownerName: getDisplayName(vendor.userId),
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

  const { page = 1, limit = 10, role = 'all', status = 'all', search = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (role && role !== 'all') {
    if (role === 'horoscope_seeker') {
      query.role = 'user';
      query.userType = 'horoscope_seeker';
    } else {
      query.role = role;
    }
  }

  if (status === 'active') {
    query['verification.emailVerified'] = true;
  }

  if (status === 'unverified') {
    query['verification.emailVerified'] = false;
  }

  if (search?.trim()) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('email personalInfo verification role userType createdAt updatedAt')
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
        name: getDisplayName(user),
        role: user.role,
        userType: user.userType || 'partner',
        status: getUserStatus(user),
        profilePic: user.personalInfo?.profilePic || '',
        emailVerified: user.verification?.emailVerified || false,
        phoneVerified: user.verification?.phoneVerified || false,
        registeredAt: user.createdAt,
        lastActiveAt: user.updatedAt || user.createdAt,
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
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    totalVendors,
    pendingVendors,
    approvedVendors,
    totalMatches,
    totalProjects,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: currentMonthStart } }),
    User.countDocuments({ role: 'user', createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
    Vendor.countDocuments({}),
    Vendor.countDocuments({ approvalStatus: 'pending' }),
    Vendor.countDocuments({ approvalStatus: 'approved' }),
    Match.countDocuments({}),
    WeddingProject.countDocuments({}),
  ]);

  const [
    allMatches,
    allUsers,
    vendorCategoryCounts,
  ] = await Promise.all([
    Match.find({}).select('compatibilityScore').lean(),
    User.find({ role: 'user' }).select('personalInfo.location createdAt verification').lean(),
    Vendor.aggregate([
      { $group: { _id: '$category', quotes: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', quotes: 1 } },
      { $sort: { quotes: -1 } },
    ]),
  ]);

  const compatibilityDistribution = [
    { range: '80-100%', count: 0 },
    { range: '60-79%', count: 0 },
    { range: '40-59%', count: 0 },
    { range: '20-39%', count: 0 },
    { range: '0-19%', count: 0 },
  ];

  allMatches.forEach((match) => {
    const score = Number(match.compatibilityScore || 0);
    if (score >= 80) compatibilityDistribution[0].count += 1;
    else if (score >= 60) compatibilityDistribution[1].count += 1;
    else if (score >= 40) compatibilityDistribution[2].count += 1;
    else if (score >= 20) compatibilityDistribution[3].count += 1;
    else compatibilityDistribution[4].count += 1;
  });

  const provinceBuckets = {
    Western: 0,
    Central: 0,
    Southern: 0,
    Northern: 0,
    Eastern: 0,
    Other: 0,
  };

  allUsers.forEach((user) => {
    const location = String(user?.personalInfo?.location || '').toLowerCase();
    if (location.includes('western') || location.includes('colombo') || location.includes('gampaha') || location.includes('kalutara')) {
      provinceBuckets.Western += 1;
    } else if (location.includes('central') || location.includes('kandy') || location.includes('matale') || location.includes('nuwara')) {
      provinceBuckets.Central += 1;
    } else if (location.includes('southern') || location.includes('galle') || location.includes('matara') || location.includes('hambantota')) {
      provinceBuckets.Southern += 1;
    } else if (location.includes('northern') || location.includes('jaffna') || location.includes('kilinochchi') || location.includes('mannar')) {
      provinceBuckets.Northern += 1;
    } else if (location.includes('eastern') || location.includes('trincomalee') || location.includes('ampara') || location.includes('batticaloa')) {
      provinceBuckets.Eastern += 1;
    } else {
      provinceBuckets.Other += 1;
    }
  });

  const provinceDistribution = Object.entries(provinceBuckets).map(([name, value]) => ({ name, value }));

  const profileCompleteCount = allUsers.filter((user) => {
    const hasLocation = Boolean(user?.personalInfo?.location);
    return hasLocation;
  }).length;

  const firstMatchCount = await Match.aggregate([
    {
      $project: {
        participants: ['$userAId', '$userBId'],
      },
    },
    { $unwind: '$participants' },
    { $group: { _id: '$participants' } },
    { $count: 'count' },
  ]);

  const mutualInterestCount = await Match.countDocuments({ mutualInterest: true });
  const messageSentCount = mutualInterestCount;

  const retentionFunnel = [
    { step: 'Registered', count: totalUsers, percentage: totalUsers ? 100 : 0 },
    { step: 'Profile Complete', count: profileCompleteCount, percentage: totalUsers ? Math.round((profileCompleteCount / totalUsers) * 100) : 0 },
    {
      step: 'First Match',
      count: firstMatchCount?.[0]?.count || 0,
      percentage: totalUsers ? Math.round(((firstMatchCount?.[0]?.count || 0) / totalUsers) * 100) : 0,
    },
    {
      step: 'Mutual Interest',
      count: mutualInterestCount,
      percentage: totalUsers ? Math.round((mutualInterestCount / totalUsers) * 100) : 0,
    },
    {
      step: 'Message Sent',
      count: messageSentCount,
      percentage: totalUsers ? Math.round((messageSentCount / totalUsers) * 100) : 0,
    },
  ];

  const growthDelta = newUsersThisMonth - newUsersLastMonth;

  // Calculate new analytics
  const [rawGenderCounts, rawRashiCounts, allUsersWithAge] = await Promise.all([
    User.aggregate([
      { $match: { role: 'user', 'personalInfo.gender': { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$personalInfo.gender', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: '$count' } }
    ]),
    User.aggregate([
      { $match: { role: 'user', 'horoscopeData.rashi': { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$horoscopeData.rashi', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: '$count' } },
      { $sort: { value: -1 } }
    ]),
    User.find({ role: 'user', 'personalInfo.age': { $exists: true, $ne: null } }).select('personalInfo.age').lean()
  ]);

  const genderMap = {
    male: 'Male',
    female: 'Female',
    'non-binary': 'Non-binary',
    'prefer_not_to_say': 'Prefer Not To Say'
  };

  const genderDistribution = rawGenderCounts.map(g => ({
    name: genderMap[g.name] || g.name || 'Other',
    value: g.value
  }));

  const rashiDistribution = rawRashiCounts.map(r => ({
    name: r.name,
    value: r.value
  }));

  const ageDistribution = [
    { range: '18-25', count: 0 },
    { range: '26-30', count: 0 },
    { range: '31-35', count: 0 },
    { range: '36-40', count: 0 },
    { range: '41-45', count: 0 },
    { range: '46+', count: 0 },
  ];

  allUsersWithAge.forEach(u => {
    const age = Number(u.personalInfo?.age);
    if (!age || Number.isNaN(age)) return;
    if (age <= 25) ageDistribution[0].count++;
    else if (age <= 30) ageDistribution[1].count++;
    else if (age <= 35) ageDistribution[2].count++;
    else if (age <= 40) ageDistribution[3].count++;
    else if (age <= 45) ageDistribution[4].count++;
    else ageDistribution[5].count++;
  });

  const mutualMatchesCount = await Match.countDocuments({ mutualInterest: true });
  const unilateralMatchesCount = Math.max(0, totalMatches - mutualMatchesCount);
  const matchInterestDistribution = [
    { name: 'Mutual Matches', value: mutualMatchesCount },
    { name: 'Unilateral Matches', value: unilateralMatchesCount }
  ];

  res.status(200).json({
    success: true,
    data: {
      generatedAt: now.toISOString(),
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
        growthDelta,
      },
      vendors: {
        total: totalVendors,
        pending: pendingVendors,
        approved: approvedVendors,
      },
      matches: totalMatches,
      projects: totalProjects,
      compatibilityDistribution,
      provinceDistribution,
      vendorCategoryDistribution: vendorCategoryCounts,
      retentionFunnel,
      genderDistribution,
      rashiDistribution,
      ageDistribution,
      matchInterestDistribution,
    },
  });
});

export const updateVendorStatus = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { id } = req.params;
  const { status, reason = '' } = req.body ?? {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid vendor ID');
  }

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Status must be pending, approved, or rejected');
  }

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.approvalStatus = status;
  vendor.verified = status === 'approved';
  vendor.adminNotes = reason?.trim() || vendor.adminNotes || '';
  vendor.verificationDate = status === 'approved' ? new Date() : vendor.verificationDate;

  vendor.approvalHistory = vendor.approvalHistory || [];
  vendor.approvalHistory.push({
    status,
    changedBy: req.user._id,
    changedAt: new Date(),
    reason: reason?.trim() || `Vendor moved to ${status}`,
  });

  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Vendor status updated successfully',
    data: {
      id: String(vendor._id),
      approvalStatus: vendor.approvalStatus,
      verified: vendor.verified,
      adminNotes: vendor.adminNotes || '',
    },
  });
});

export default {
  getOverview,
  createAdminUser,
  getPendingVendors,
  getVendorDetail,
  approveVendor,
  rejectVendor,
  updateVendorStatus,
  getUsers,
  deleteUser,
  getMatches,
  getWeddingProjects,
  getAnalytics,
};
