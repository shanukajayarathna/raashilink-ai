import HoneymoonDestination from '../models/HoneymoonDestination.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const listDestinations = asyncHandler(async (req, res) => {
  const { country, region, budgetTier, activity } = req.query;
  const query = {};

  if (country) query.country = country;
  if (region) query.region = region;
  if (budgetTier) query.budgetTier = budgetTier;
  if (activity) query.activityTags = { $in: [activity] };

  let destinations = await HoneymoonDestination.find(query)
    .sort({ country: 1, region: 1 })
    .lean();

  // Fallback: if the budget+activity combo returns nothing, loosen the budget filter
  if (destinations.length === 0 && budgetTier && activity) {
    destinations = await HoneymoonDestination.find({ activityTags: { $in: [activity] } })
      .sort({ country: 1, region: 1 })
      .lean();
  }

  // Final fallback: return all destinations if still empty
  if (destinations.length === 0) {
    destinations = await HoneymoonDestination.find({}).sort({ country: 1, region: 1 }).lean();
  }

  res.status(200).json({
    success: true,
    data: {
      items: destinations,
      total: destinations.length,
    },
  });
});

export const getDestination = asyncHandler(async (req, res) => {
  const destination = await HoneymoonDestination.findById(req.params.id).lean();
  if (!destination) {
    throw new ApiError(404, 'Honeymoon destination not found');
  }

  res.status(200).json({
    success: true,
    data: destination,
  });
});

export default {
  listDestinations,
  getDestination,
};
