import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization token is required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub || decoded.userId).select('_id email role');

    if (!user) {
      throw new ApiError(401, 'Authenticated user not found');
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
});

export default authenticate;
