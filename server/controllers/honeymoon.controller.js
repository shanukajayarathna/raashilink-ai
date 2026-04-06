import HoneymoonDestination from '../models/HoneymoonDestination.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const listDestinations = asyncHandler(async (req, res) => {
  const { country, region, budgetTier, activity } = req.query;
  const query = {};

  if (country) query.country = country;
  if (region) query.region = region;
  if (budgetTier) query.budgetTier = budgetTier;
  if (activity) query.activityTags = activity;

  const destinations = await HoneymoonDestination.find(query)
    .sort({ country: 1, region: 1 })
    .lean();

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
