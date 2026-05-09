import mongoose from 'mongoose';
import multer from 'multer';
import Vendor from '../models/Vendor.js';
import WeddingProject from '../models/WeddingProject.js';
import QuoteRequest from '../models/QuoteRequest.js';
import Notification from '../models/Notification.js';
import { emitToUser } from '../lib/socket.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { storePortfolioImages } from '../services/vendorDocumentStorage.service.js';

const portfolioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WEBP images are allowed for portfolio.'));
    }
  },
});

export { portfolioUpload };

function ensureObjectId(id, field) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

function normalizeVendorPackages(vendor) {
  const richPackages = Array.isArray(vendor?.packages)
    ? vendor.packages
        .filter((item) => item && item.name)
        .map((item, index) => ({
          id: String(item.packageId || `pkg-${index + 1}`),
          name: String(item.name),
          description: String(item.description || ''),
          price: Number(item.price || 0),
          currency: String(item.currency || 'LKR'),
          durationHours: Number(item.durationHours || 0),
          isActive: item.isActive !== false,
        }))
    : [];

  if (richPackages.length > 0) {
    return richPackages.filter((item) => item.isActive);
  }

  if (Array.isArray(vendor?.packageSummary) && vendor.packageSummary.length > 0) {
    return vendor.packageSummary
      .filter(Boolean)
      .map((item, index) => ({
        id: `summary-${index + 1}`,
        name: String(item),
        description: '',
        price: 0,
        currency: 'LKR',
        durationHours: 0,
        isActive: true,
      }));
  }

  return [];
}

function getCalendarDateOnly(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function combineDateAndTime(dateLike, timeText) {
  const base = new Date(dateLike);
  if (Number.isNaN(base.getTime()) || !timeText) return null;
  const [hh, mm] = String(timeText).split(':').map((part) => Number(part));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const merged = new Date(base);
  merged.setHours(hh, mm, 0, 0);
  return merged;
}

function resolveScheduledRange(details, payload) {
  const directStart = payload?.scheduledStart ? new Date(payload.scheduledStart) : null;
  const directEnd = payload?.scheduledEnd ? new Date(payload.scheduledEnd) : null;

  if (directStart && directEnd && !Number.isNaN(directStart.getTime()) && !Number.isNaN(directEnd.getTime())) {
    return { start: directStart, end: directEnd };
  }

  const baseDate = payload?.scheduledDate || details?.weddingDate;
  const start = combineDateAndTime(baseDate, payload?.startTime || '10:00');
  const end = combineDateAndTime(baseDate, payload?.endTime || '14:00');
  if (!start || !end) return null;
  return { start, end };
}

function mapVendor(vendor) {
  const packages = normalizeVendorPackages(vendor);

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
    packages,
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
    selectedPackageId,
    selectedPackageName,
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
    project = await WeddingProject.create({
      coupleUserIds: [req.user._id],
      weddingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      totalBudget: 0,
      expenses: [],
      checklist: [],
      vendors: [],
    });
  }

  const requesterName =
    req.user?.name ||
    [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() ||
    'RaashiLink Couple';
  const vendorPackages = normalizeVendorPackages(vendor);
  const selectedPackage = vendorPackages.find(
    (item) =>
      (selectedPackageId && String(item.id) === String(selectedPackageId)) ||
      (selectedPackageName && item.name.toLowerCase() === String(selectedPackageName).toLowerCase())
  );

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
      preferredPackage: selectedPackage?.name || selectedPackageName || preferredPackage || '',
      selectedPackage: {
        id: selectedPackage?.id || selectedPackageId || '',
        name: selectedPackage?.name || selectedPackageName || preferredPackage || '',
        price: Number(selectedPackage?.price || 0),
        currency: selectedPackage?.currency || 'LKR',
      },
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
    existing.selectedPackageId = selectedPackage?.id || selectedPackageId || '';
    existing.selectedPackageName = selectedPackage?.name || selectedPackageName || preferredPackage || '';
  } else {
    project.vendors.push({
      vendorId,
      category: category || vendor.category,
      quotedAmount: Number(quotedAmount || budgetMax || 0),
      selectedPackageId: selectedPackage?.id || selectedPackageId || '',
      selectedPackageName: selectedPackage?.name || selectedPackageName || preferredPackage || '',
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

  try {
    const notification = await Notification.create({
      userId: vendor.userId,
      type: 'vendor_quote_request',
      fromUserId: req.user._id,
      fromUserName: requesterName,
      fromUserProfilePic: null,
      metadata: {
        quoteRequestId: String(quoteRequest._id),
        vendorId: String(vendor._id),
        preview: message || `New quote request for ${vendor.businessName}`,
      },
    });

    emitToUser(String(vendor.userId), 'notification', {
      id: String(notification._id),
      type: notification.type,
      fromUserId: String(req.user._id),
      fromUserName: requesterName,
      fromUserProfilePic: null,
      conversationId: null,
      metadata: notification.metadata || null,
      read: false,
      createdAt: notification.createdAt,
      preview: notification.metadata?.preview || '',
    });
  } catch {
    // Notification creation should not block quote request submission.
  }

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
  const selectedPackage = details.selectedPackage || {};
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
    paymentStatus: quote.paymentStatus || 'pending',
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
    selectedPackageId: selectedPackage.id || '',
    selectedPackageName: selectedPackage.name || details.preferredPackage || '',
    preferredPackage: details.preferredPackage || '',
    coverageHours: Number(details.coverageHours || 0),
    requirements: details.requirements || '',
    contactEmail: details.contactEmail || '',
    contactPhone: details.contactPhone || '',
    preferredContactMethod: details.preferredContactMethod || 'platform',
    response: quote.response || null,
    scheduledStart: quote.response?.scheduledStart || null,
    scheduledEnd: quote.response?.scheduledEnd || null,
  };
}

export const getVendorQuoteInbox = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id }).select('_id').lean();
  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const quotes = await QuoteRequest.find({
    $or: [
      { vendorUserId: req.user._id },
      { vendorId: vendor._id },
    ],
  })
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
  const { status, price, packageName, message, paymentStatus } = req.body ?? {};
  const allowedStatuses = ['responded', 'accepted', 'declined', 'cancelled_by_vendor'];
  const allowedPaymentStatuses = ['pending', 'partial', 'paid'];

  // Payment-status-only update
  if (!status && paymentStatus) {
    if (!allowedPaymentStatuses.includes(paymentStatus)) {
      throw new ApiError(400, `paymentStatus must be one of: ${allowedPaymentStatuses.join(', ')}`);
    }
    const quote = await QuoteRequest.findById(req.params.id);
    if (!quote) throw new ApiError(404, 'Quote request not found');
    let hasAccess = String(quote.vendorUserId || '') === String(req.user._id);
    if (!hasAccess) {
      const ownVendor = await Vendor.findOne({ userId: req.user._id }).select('_id').lean();
      hasAccess = Boolean(ownVendor && String(quote.vendorId || '') === String(ownVendor._id));
    }
    if (!hasAccess) throw new ApiError(403, 'You do not have access to this quote request');
    quote.paymentStatus = paymentStatus;
    await quote.save();
    return res.status(200).json({ success: true, data: { paymentStatus } });
  }

  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const quote = await QuoteRequest.findById(req.params.id);
  if (!quote) {
    throw new ApiError(404, 'Quote request not found');
  }

  let hasAccess = String(quote.vendorUserId || '') === String(req.user._id);
  if (!hasAccess) {
    const ownVendor = await Vendor.findOne({ userId: req.user._id }).select('_id').lean();
    hasAccess = Boolean(ownVendor && String(quote.vendorId || '') === String(ownVendor._id));
  }

  if (!hasAccess) {
    throw new ApiError(403, 'You do not have access to this quote request');
  }

  const details = quote.requestDetails || {};
  let scheduledRange = null;
  let vendor = null;
  if (status === 'accepted') {
    scheduledRange = resolveScheduledRange(details, req.body);
    if (!scheduledRange || Number.isNaN(scheduledRange.start.getTime()) || Number.isNaN(scheduledRange.end.getTime())) {
      throw new ApiError(400, 'A valid schedule is required to approve this request');
    }
    if (scheduledRange.end <= scheduledRange.start) {
      throw new ApiError(400, 'Scheduled end time must be after start time');
    }

    vendor = await Vendor.findById(quote.vendorId);
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }

    const scheduledDateOnly = getCalendarDateOnly(scheduledRange.start);
    const hasConflict = (vendor.availabilityCalendar || []).some((entry) => {
      const calendarDateOnly = getCalendarDateOnly(entry.date);
      return (
        calendarDateOnly &&
        scheduledDateOnly &&
        calendarDateOnly.getTime() === scheduledDateOnly.getTime() &&
        ['booked', 'blocked'].includes(entry.status)
      );
    });

    if (hasConflict) {
      throw new ApiError(409, 'The selected date is not available on your calendar');
    }
  }

  quote.status = status;
  if (status === 'responded' || status === 'accepted') {
    quote.response = {
      price: Number(price || 0),
      packageName: packageName || details?.selectedPackage?.name || details.preferredPackage || '',
      message: message || '',
      scheduledStart: status === 'accepted' ? scheduledRange?.start : quote.response?.scheduledStart,
      scheduledEnd: status === 'accepted' ? scheduledRange?.end : quote.response?.scheduledEnd,
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
      entry.selectedPackageName = packageName || details?.selectedPackage?.name || details.preferredPackage || '';
      entry.selectedPackageId = details?.selectedPackage?.id || '';
      if (status === 'accepted') {
        entry.status = 'booked';
        entry.confirmedStart = scheduledRange?.start;
        entry.confirmedEnd = scheduledRange?.end;
        const vendorMeta = vendor || (await Vendor.findById(quote.vendorId));
        const vendorInfo = vendorMeta ? vendorMeta.toObject?.() || vendorMeta : null;
        const vendorCategory = vendorInfo?.category;
        if (vendorMeta) {
          const scheduledDateOnly = getCalendarDateOnly(scheduledRange?.start);
          const filtered = (vendorMeta.availabilityCalendar || []).filter((item) => {
            const day = getCalendarDateOnly(item.date);
            return !(scheduledDateOnly && day && scheduledDateOnly.getTime() === day.getTime());
          });
          vendorMeta.availabilityCalendar = [
            ...filtered,
            { date: scheduledDateOnly || scheduledRange.start, status: 'booked' },
          ];
          await vendorMeta.save();
        }
        if (vendorCategory === 'Venue') {
          project.venueId = quote.vendorId;
        }
      } else if (status === 'declined' || status === 'cancelled_by_vendor') {
        entry.status = 'cancelled';
      } else {
        entry.status = 'requested';
      }
      await project.save();
    }
  }

  // --- Cancellation by vendor: notify couple + clean calendar ---
  if (status === 'cancelled_by_vendor') {
    const projectForCancel = await WeddingProject.findById(quote.projectId);
    if (projectForCancel) {
      // Clear confirmed dates from the project entry
      const cancelEntry = projectForCancel.vendors.find(
        (item) => String(item.quoteRequestId || '') === String(quote._id)
      );
      if (cancelEntry && cancelEntry.confirmedStart) {
        cancelEntry.confirmedStart = undefined;
        cancelEntry.confirmedEnd = undefined;
        if (String(projectForCancel.venueId || '') === String(quote.vendorId)) {
          projectForCancel.venueId = undefined;
        }
        await projectForCancel.save();
      }
      // Notify both partners in real-time
      const allCoupleIds = (projectForCancel.coupleUserIds || []).map(String);
      for (const uid of allCoupleIds) {
        emitToUser(uid, 'quote_request_updated', {
          quoteRequestId: String(quote._id),
          status: 'cancelled_by_vendor',
        });
      }
    }

    // Remove booked calendar entry from vendor
    const vendorForCancel = await Vendor.findById(quote.vendorId);
    if (vendorForCancel && quote.response?.scheduledStart) {
      const cancelledDate = getCalendarDateOnly(quote.response.scheduledStart);
      vendorForCancel.availabilityCalendar = (vendorForCancel.availabilityCalendar || []).filter((item) => {
        const d = getCalendarDateOnly(item.date);
        return !(d && cancelledDate && d.getTime() === cancelledDate.getTime());
      });
      await vendorForCancel.save();
    }

    // Persist DB notification for the couple
    const vendorUser = await import('../models/User.js').then(m => m.default.findById(req.user._id).select('name firstName lastName').lean()).catch(() => null);
    const vendorName = vendorUser?.name || [vendorUser?.firstName, vendorUser?.lastName].filter(Boolean).join(' ').trim() || 'Your Vendor';
    try {
      const notification = await Notification.create({
        userId: quote.requesterUserId,
        type: 'vendor_booking_cancelled',
        fromUserId: req.user._id,
        fromUserName: vendorName,
        fromUserProfilePic: null,
        metadata: {
          quoteRequestId: String(quote._id),
          vendorId: String(quote.vendorId),
          preview: `${vendorName} has cancelled your booking. Please contact them for details.`,
        },
      });
      emitToUser(String(quote.requesterUserId), 'notification', {
        id: String(notification._id),
        type: notification.type,
        fromUserId: String(req.user._id),
        fromUserName: vendorName,
        vendorName: vendorName,
        fromUserProfilePic: null,
        conversationId: null,
        metadata: notification.metadata,
        read: false,
        createdAt: notification.createdAt,
        preview: notification.metadata?.preview || '',
      });
    } catch { /* notification failure should not block the response */ }

    return res.status(200).json({ success: true, data: { status: 'cancelled_by_vendor' } });
  }

  emitToUser(String(quote.requesterUserId), 'quote_request_updated', {
    quoteRequestId: String(quote._id),
    status: quote.status,
    scheduledStart: quote.response?.scheduledStart || null,
    scheduledEnd: quote.response?.scheduledEnd || null,
  });

  // Also emit DB-backed notification for accepted status
  if (status === 'accepted') {
    const acceptingVendorUser = await import('../models/User.js').then(m => m.default.findById(req.user._id).select('name firstName lastName').lean()).catch(() => null);
    const acceptorName = acceptingVendorUser?.name || [acceptingVendorUser?.firstName, acceptingVendorUser?.lastName].filter(Boolean).join(' ').trim() || 'Your Vendor';
    try {
      const notification = await Notification.create({
        userId: quote.requesterUserId,
        type: 'vendor_quote_request',
        fromUserId: req.user._id,
        fromUserName: acceptorName,
        fromUserProfilePic: null,
        metadata: {
          quoteRequestId: String(quote._id),
          vendorId: String(quote.vendorId),
          preview: `${acceptorName} accepted your quote request and confirmed your booking!`,
        },
      });
      emitToUser(String(quote.requesterUserId), 'notification', {
        id: String(notification._id),
        type: notification.type,
        fromUserId: String(req.user._id),
        fromUserName: acceptorName,
        fromUserProfilePic: null,
        conversationId: null,
        metadata: notification.metadata,
        read: false,
        createdAt: notification.createdAt,
        preview: notification.metadata?.preview || '',
      });
    } catch { /* silent */ }
  }

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

export const getVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id }).lean();

  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found. Please complete vendor registration.');
  }

  if (vendor.approvalStatus === 'pending') {
    throw new ApiError(403, 'Your vendor profile is pending admin approval. Dashboard access is restricted until approval.');
  }
  if (vendor.approvalStatus === 'rejected') {
    throw new ApiError(403, 'Your vendor profile has been rejected. Please contact support.');
  }

  res.status(200).json({
    success: true,
    data: {
      id: String(vendor._id),
      businessName: vendor.businessName,
      category: vendor.category,
      description: vendor.description,
      city: vendor.city,
      address: vendor.address,
      contactPhone: vendor.contactPhone,
      contactEmail: vendor.contactEmail,
      website: vendor.website,
      serviceArea: vendor.serviceArea,
      pricingRange: vendor.pricingRange,
      packages: vendor.packages || [],
      packageSummary: vendor.packageSummary || [],
      portfolioImages: vendor.portfolioImages || [],
      availabilityCalendar: vendor.availabilityCalendar || [],
      businessRegistrationNumber: vendor.businessRegistrationNumber,
      socialLinks: vendor.socialLinks,
      documents: vendor.documents,
      approvalStatus: vendor.approvalStatus,
      verified: vendor.verified,
      ratings: vendor.ratings || { average: 0, count: 0 },
    },
  });
});

export const updateVendorProfile = asyncHandler(async (req, res) => {
  const {
    businessName, category, description, city, address,
    contactPhone, contactEmail, website, serviceArea,
    pricingRange, socialLinks, packages, availabilityCalendar,
  } = req.body ?? {};

  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found');
  if (vendor.approvalStatus === 'pending') throw new ApiError(403, 'Cannot update profile while pending admin approval');

  if (businessName) vendor.businessName = businessName.trim();
  if (category) vendor.category = category.trim();
  if (description !== undefined) vendor.description = String(description).trim();
  if (city !== undefined) vendor.city = String(city).trim();
  if (address !== undefined) vendor.address = String(address).trim();
  if (contactPhone !== undefined) vendor.contactPhone = String(contactPhone).trim();
  if (contactEmail !== undefined) vendor.contactEmail = String(contactEmail).trim();
  if (website !== undefined) vendor.website = String(website).trim();
  if (Array.isArray(serviceArea)) vendor.serviceArea = serviceArea;
  if (pricingRange && Number(pricingRange.min) >= 0 && Number(pricingRange.max) >= Number(pricingRange.min)) {
    vendor.pricingRange = { min: Number(pricingRange.min), max: Number(pricingRange.max) };
  }
  if (socialLinks) vendor.socialLinks = { ...vendor.socialLinks, ...socialLinks };
  if (Array.isArray(packages)) {
    vendor.packages = packages
      .map((pkg, idx) => ({
        packageId: pkg.packageId || pkg.id || ('pkg-' + (idx + 1)),
        name: String(pkg.name || '').trim(),
        description: String(pkg.description || '').trim(),
        price: Number(pkg.price || 0),
        currency: String(pkg.currency || 'LKR').trim(),
        durationHours: Number(pkg.durationHours || 0),
        isActive: pkg.isActive !== false,
      }))
      .filter(pkg => pkg.name);
    vendor.packageSummary = vendor.packages.map(p => p.name);
  }
  if (Array.isArray(availabilityCalendar)) {
    vendor.availabilityCalendar = availabilityCalendar
      .map(entry => ({
        date: new Date(entry.date),
        status: ['available', 'booked', 'blocked'].includes(entry.status) ? entry.status : 'available',
      }))
  }

  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Vendor profile updated successfully',
    data: {
      id: String(vendor._id),
      businessName: vendor.businessName,
      category: vendor.category,
      description: vendor.description,
      city: vendor.city,
      address: vendor.address,
      contactPhone: vendor.contactPhone,
      contactEmail: vendor.contactEmail,
      website: vendor.website,
      serviceArea: vendor.serviceArea,
      pricingRange: vendor.pricingRange,
      packages: vendor.packages,
      packageSummary: vendor.packageSummary,
      portfolioImages: vendor.portfolioImages || [],
      availabilityCalendar: vendor.availabilityCalendar,
      approvalStatus: vendor.approvalStatus,
    },
  });
});

export const uploadPortfolioImages = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    throw new ApiError(400, 'No image files provided');
  }

  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found');

  const baseApiUrl = `${req.protocol}://${req.get('host')}`;
  const newUrls = await storePortfolioImages({ files, baseApiUrl });

  vendor.portfolioImages = [...(vendor.portfolioImages || []), ...newUrls];
  await vendor.save();

  res.status(200).json({
    success: true,
    data: { portfolioImages: vendor.portfolioImages },
  });
});

export const removePortfolioImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body ?? {};
  if (!imageUrl) throw new ApiError(400, 'imageUrl is required');

  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found');

  vendor.portfolioImages = (vendor.portfolioImages || []).filter((u) => u !== imageUrl);
  await vendor.save();

  res.status(200).json({
    success: true,
    data: { portfolioImages: vendor.portfolioImages },
  });
});

export default {
  searchVendors,
  getVendorDetail,
  submitQuote,
  getVendorQuoteInbox,
  updateQuoteRequest,
  getVendorReviews,
  getVendorProfile,
  updateVendorProfile,
  uploadPortfolioImages,
  removePortfolioImage,
};
