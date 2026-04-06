import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message = err.message || 'Internal server error';
  let details = err.details ?? null;

  if (err?.type === 'entity.too.large' || err?.status === 413) {
    statusCode = 413;
    message = 'Uploaded data is too large. Try a smaller profile image.';
  } else if (err?.name === 'ValidationError') {
    statusCode = 400;
    const validationMessages = Object.values(err.errors || {}).map((entry) => entry.message);
    details = validationMessages;
    message = validationMessages[0] || 'Submitted data is invalid.';
  } else if (err?.code === 11000) {
    statusCode = 409;
    const duplicateFields = Object.keys(err.keyPattern || {});
    details = duplicateFields.map((field) => `${field} is already in use`);
    message = details[0] || 'A unique field is already in use.';
  }

  logger.error('Request failed', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
