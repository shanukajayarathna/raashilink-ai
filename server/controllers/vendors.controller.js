import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';
import WeddingProject from '../models/WeddingProject.js';
import QuoteRequest from '../models/QuoteRequest.js';
import { emitToUser } from '../lib/socket.js';
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
    city: vendor.city || vendor.userId?.location || vendor.serviceArea?.[0] || '',
    address: vendor.address || '',
    contactPhone: vendor.contactPhone || vendor.userId?.phone || '',
    contactEmail: vendor.contactEmail || vendor.userId?.email || '',
    website: vendor.website || '',
    serviceArea: vendor.serviceArea,
    pricingRange: vendor.pricingRange,
    featuredServices: vendor.featuredServices || [],
    packageSummary: vendor.packageSummary || [],
    responseTime: vendor.responseTime || '',
    leadTimeDays: Number(vendor.leadTimeDays || 0),
    capacity: vendor.capacity || { minGuests: 0, maxGuests: 0 },
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
  const {
    vendorId,
    projectId,
    message,
    category,
    quotedAmount,
    eventType,
    weddingDate,
    guestCount,
    location,
    venueName,
    preferredPackage,
    coverageHours,
    budgetMin,
    budgetMax,
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

  const requesterName =
    req.user?.name ||
    [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() ||
    'RaashiLink Couple';
  const quoteRequest = await QuoteRequest.create({
    vendorId: vendor._id,
    vendorUserId: vendor.userId,
    requesterUserId: req.user._id,
    projectId: project._id,
    category: category || vendor.category,
    requestDetails: {
      eventType: eventType || 'Wedding',
      weddingDate: weddingDate || project.weddingDate,
      guestCount: Number(guestCount || 0),
      location: location || '',
      venueName: venueName || '',
      preferredPackage: preferredPackage || '',
      coverageHours: Number(coverageHours || 0),
      budgetRange: {
        min: Number(budgetMin || 0),
        max: Number(budgetMax || quotedAmount || 0),
        currency: 'LKR',
      },
      contactName: contactName || requesterName,
      contactEmail: contactEmail || req.user?.email || '',
      contactPhone: contactPhone || req.user?.phone || '',
      preferredContactMethod: preferredContactMethod || 'platform',
      requirements: message || '',
    },
  });

  const existing = project.vendors.find(
    (entry) => String(entry.vendorId) === String(vendorId)
  );

  if (existing) {
    existing.status = 'requested';
    existing.category = category || existing.category;
    existing.quotedAmount = Number(quotedAmount || existing.quotedAmount || budgetMax || 0);
    existing.quoteRequestId = quoteRequest._id;
    existing.requestedAt = new Date();
    existing.vendorName = vendor.businessName;
    existing.notes = message || '';
  } else {
    project.vendors.push({
      vendorId,
      category: category || vendor.category,
      quotedAmount: Number(quotedAmount || budgetMax || 0),
      quoteRequestId: quoteRequest._id,
      requestedAt: new Date(),
      vendorName: vendor.businessName,
      notes: message || '',
      status: 'requested',
    });
  }

  await project.save();
  emitToUser(String(vendor.userId), 'vendor_quote_request', {
    quoteRequestId: String(quoteRequest._id),
    vendorId: String(vendor._id),
    requesterName,
  });

  res.status(201).json({
    success: true,
    data: {
      projectId: String(project._id),
      vendorId,
      quoteRequestId: String(quoteRequest._id),
      message: message || 'Quote request submitted successfully.',
    },
  });
});

function formatQuoteRequest(quote) {
  const requester = quote.requesterUserId;
  const details = quote.requestDetails || {};
  const budgetRange = details.budgetRange || {};
  const minBudget = Number(budgetRange.min || 0);
  const maxBudget = Number(budgetRange.max || 0);
  const budgetLabel =
    minBudget && maxBudget
      ? `LKR ${minBudget.toLocaleString()} - ${maxBudget.toLocaleString()}`
      : maxBudget
      ? `Up to LKR ${maxBudget.toLocaleString()}`
      : minBudget
      ? `From LKR ${minBudget.toLocaleString()}`
      : 'Not specified';

  return {
    id: String(quote._id),
    vendorId: String(quote.vendorId?._id || quote.vendorId),
    projectId: String(quote.projectId?._id || quote.projectId),
    category: quote.category,
    status: quote.status,
    createdAt: quote.createdAt,
    coupleName:
      details.contactName ||
      requester?.name ||
      [requester?.firstName, requester?.lastName].filter(Boolean).join(' ').trim() ||
      'RaashiLink Couple',
    weddingDate: details.weddingDate,
    location: details.location || details.venueName || '',
    venueName: details.venueName || '',
    budget: budgetLabel,
    guestCount: Number(details.guestCount || 0),
    preferredPackage: details.preferredPackage || '',
    coverageHours: Number(details.coverageHours || 0),
    requirements: details.requirements || '',
    contactEmail: details.contactEmail || '',
    contactPhone: details.contactPhone || '',
    preferredContactMethod: details.preferredContactMethod || 'platform',
    response: quote.response || null,
  };
}

export const getVendorQuoteInbox = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id }).select('_id').lean();
  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const quotes = await QuoteRequest.find({ vendorUserId: req.user._id })
    .populate('requesterUserId', 'personalInfo')
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });

  res.status(200).json({
    success: true,
    data: {
      items: quotes.map(formatQuoteRequest),
      total: quotes.length,
    },
  });
});

export const updateQuoteRequest = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'quoteRequestId');
  const { status, price, packageName, message } = req.body ?? {};
  const allowedStatuses = ['responded', 'accepted', 'declined'];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const quote = await QuoteRequest.findById(req.params.id);
  if (!quote) {
    throw new ApiError(404, 'Quote request not found');
  }
  if (String(quote.vendorUserId) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have access to this quote request');
  }

  quote.status = status;
  if (status === 'responded' || status === 'accepted') {
    quote.response = {
      price: Number(price || 0),
      packageName: packageName || '',
      message: message || '',
      respondedAt: new Date(),
    };
  }

  await quote.save();

  const project = await WeddingProject.findById(quote.projectId);
  if (project) {
    const entry = project.vendors.find((item) => String(item.quoteRequestId || '') === String(quote._id));
    if (entry) {
      entry.quotedAmount = Number(price || entry.quotedAmount || 0);
      entry.notes = message || entry.notes || '';
      if (status === 'accepted') {
        entry.status = 'booked';
        const vendor = await Vendor.findById(quote.vendorId).select('category').lean();
        if (vendor?.category === 'Venue') {
          project.venueId = quote.vendorId;
        }
      } else if (status === 'declined') {
        entry.status = 'cancelled';
      } else {
        entry.status = 'requested';
      }
      await project.save();
    }
  }

  emitToUser(String(quote.requesterUserId), 'quote_request_updated', {
    quoteRequestId: String(quote._id),
    status: quote.status,
  });

  res.status(200).json({
    success: true,
    data: formatQuoteRequest(
      await QuoteRequest.findById(quote._id).populate('requesterUserId', 'personalInfo').lean({ virtuals: true })
    ),
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
  getVendorQuoteInbox,
  updateQuoteRequest,
  getVendorReviews,
};
