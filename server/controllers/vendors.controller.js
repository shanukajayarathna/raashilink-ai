import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';
import WeddingProject from '../models/WeddingProject.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

function ensureObjectId(id, field) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

function mapVendor(vendor) {
  return {
    id: String(vendor._id),
    userId: String(vendor.userId?._id || vendor.userId),
    businessName: vendor.businessName,
    category: vendor.category,
    description: vendor.description,
    serviceArea: vendor.serviceArea,
    pricingRange: vendor.pricingRange,
    portfolioImages: vendor.portfolioImages,
    ratings: vendor.ratings,
    reviews: vendor.reviews || [],
    verified: vendor.verified,
    availabilityCalendar: vendor.availabilityCalendar || [],
    owner: vendor.userId
      ? {
          name: vendor.userId.name,
          email: vendor.userId.email,
          location: vendor.userId.location,
        }
      : null,
  };
}

export const searchVendors = asyncHandler(async (req, res) => {
  const { category, area, verified, budgetMin, budgetMax } = req.query;
  const query = {};

  if (category) query.category = category;
  if (area) query.serviceArea = area;
  if (verified !== undefined) query.verified = verified === 'true';
  if (budgetMin || budgetMax) {
    query['pricingRange.min'] = {};
    if (budgetMin) query['pricingRange.min'].$gte = Number(budgetMin);
    if (budgetMax) query['pricingRange.max'] = { $lte: Number(budgetMax) };
  }

  const vendors = await Vendor.find(query)
    .populate('userId', 'email personalInfo')
    .sort({ verified: -1, 'ratings.average': -1, createdAt: -1 })
    .lean({ virtuals: true });

  res.status(200).json({
    success: true,
    data: {
      items: vendors.map(mapVendor),
      total: vendors.length,
    },
  });
});

export const getVendorDetail = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'vendorId');

  const vendor = await Vendor.findById(req.params.id)
    .populate('userId', 'email personalInfo')
    .lean({ virtuals: true });

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  res.status(200).json({
    success: true,
    data: mapVendor(vendor),
  });
});

export const submitQuote = asyncHandler(async (req, res) => {
  const { vendorId, projectId, message, category, quotedAmount } = req.body ?? {};

  ensureObjectId(vendorId, 'vendorId');

  const vendor = await Vendor.findById(vendorId).lean();
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  let project = null;
  if (projectId) {
    ensureObjectId(projectId, 'projectId');
    project = await WeddingProject.findById(projectId);
  } else {
    project = await WeddingProject.findOne({
      coupleUserIds: req.user._id,
    }).sort({ createdAt: -1 });
  }

  if (!project) {
    throw new ApiError(404, 'Wedding project not found for quote request');
  }

  const existing = project.vendors.find(
    (entry) => String(entry.vendorId) === String(vendorId)
  );

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
      message: message || 'Quote request submitted successfully.',
    },
  });
});

export const getVendorReviews = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'vendorId');

  const vendor = await Vendor.findById(req.params.id).lean();
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  res.status(200).json({
    success: true,
    data: {
      reviews: vendor.reviews || [],
      ratings: vendor.ratings || { average: 0, count: 0 },
    },
  });
});

export default {
  searchVendors,
  getVendorDetail,
  submitQuote,
  getVendorReviews,
};
