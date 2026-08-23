import config from '../config/index.js';
import mongoose from 'mongoose';

const errorHandler = (err, req, res, _next) => {
  const isProd = config.nodeEnv === 'production';

  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal server error';
  let details;

  // Normalize common database / framework errors into safe, operational responses.
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed.';
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    message = `A ${field} with that value already exists.`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token.';
  }

  // Never leak internals in production; only operational messages are safe.
  if (isProd && !err.isOperational) {
    message = 'Internal server error';
    details = undefined;
  }

  if (!isProd) {
    console.error(`${new Date().toISOString()} - [${statusCode}] ${message}`);
  }

  const body = { error: message };
  if (details) body.details = details;

  res.status(statusCode).json(body);
};

export default errorHandler;
