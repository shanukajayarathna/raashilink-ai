import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message = err.message || 'Internal server error';
  let details = err.details ?? null;

  if (err?.type === 'entity.too.large' || err?.status === 413) {
    statusCode = 413;
    message = 'Uploaded data is too large. Try a smaller profile image.';
  } else if (err?.name === 'MulterError' && err?.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Image upload must be under 6 MB.';
  } else if (err?.name === 'ValidationError') {
    statusCode = 400;
    const validationMessages = Object.entries(err.errors || {}).map(([key, entry]) => {
      const fieldName = key.split('.').pop();
      let cleanMessage = entry.message;
      const humanField = fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());

      if (entry.kind === 'maxlength') {
        const maxLen = entry.properties?.maxlength || 100;
        cleanMessage = `${humanField} is too long. The maximum allowed length is ${maxLen} characters.`;
      } else if (entry.kind === 'minlength') {
        const minLen = entry.properties?.minlength || 3;
        cleanMessage = `${humanField} is too short. It must be at least ${minLen} characters.`;
      } else if (entry.kind === 'required') {
        cleanMessage = `${humanField} is required.`;
      }
      return `${fieldName}: ${cleanMessage}`;
    });
    details = validationMessages;
    const firstDetail = validationMessages[0] || '';
    message = firstDetail.includes(':') 
      ? firstDetail.split(':').slice(1).join(':').trim() 
      : 'Submitted data is invalid.';
  } else if (err?.code === 11000) {
    statusCode = 409;
    const duplicateFields = Object.keys(err.keyPattern || {});
    details = duplicateFields.map((field) => `${field} is already in use`);
    message = details[0] || 'A unique field is already in use.';
  }

  logger.error('Request failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    details,
    errorName: err?.name,
    stack: err?.stack,
  });

  res.status(statusCode).json({
    success: false,
    requestId: req.requestId,
    message,
    ...(details ? { details } : {}),
  });
}
