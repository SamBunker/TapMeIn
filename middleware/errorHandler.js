const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Error:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from duplicate key error
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    // Provide more specific error messages for common fields
    if (field === 'email') {
      message = `Email '${value}' is already registered`;
    } else if (field === 'cardUID') {
      message = `Card with UID '${value}' already exists`;
    } else if (field === 'activationCode') {
      message = `Activation code '${value}' already exists`;
    } else {
      message = `${field} '${value}' already exists`;
    }
    
    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      message: messages.join(', '),
      statusCode: 400,
      details: messages
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'File too large',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      message: 'Too many files',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Unexpected file field',
      statusCode: 400
    };
  }

  // Stripe errors
  if (err.type === 'StripeCardError') {
    error = {
      message: 'Your card was declined',
      statusCode: 402,
      stripeError: true
    };
  }

  if (err.type === 'StripeInvalidRequestError') {
    error = {
      message: 'Invalid payment request',
      statusCode: 400,
      stripeError: true
    };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    error = {
      message: 'Too many requests, please try again later',
      statusCode: 429
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Prepare error response
  const errorResponse = {
    success: false,
    error: message
  };

  // Add additional details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = error.details;
  }

  // Add specific error types for client handling
  if (error.stripeError) {
    errorResponse.type = 'payment_error';
  }

  if (err.name === 'ValidationError') {
    errorResponse.type = 'validation_error';
    errorResponse.fields = error.details;
  }

  if (statusCode === 401) {
    errorResponse.type = 'authentication_error';
  }

  if (statusCode === 403) {
    errorResponse.type = 'authorization_error';
  }

  if (statusCode === 402) {
    errorResponse.type = 'subscription_error';
  }

  // Log critical errors to external service in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    // Here you would integrate with error tracking service like Sentry
    console.error('CRITICAL ERROR:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null,
      timestamp: new Date().toISOString()
    });
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;