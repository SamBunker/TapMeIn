const notFound = (req, res, next) => {
  // Check if this is an API request
  const isApiRequest = req.originalUrl.startsWith('/api/');
  
  if (isApiRequest) {
    // Return JSON error for API requests
    res.status(404).json({
      success: false,
      error: `API endpoint '${req.originalUrl}' not found`,
      method: req.method,
      availableEndpoints: {
        auth: '/api/auth',
        users: '/api/users',
        admin: '/api/admin',
        cards: '/api/cards',
        profiles: '/api/profiles',
        analytics: '/api/analytics',
        subscription: '/api/subscription',
        interviews: '/api/interviews',
        tap: '/tap/:cardUID',
        health: '/api/health'
      }
    });
  } else {
    // For web requests, you might want to render a 404 page
    // For now, we'll return JSON, but you can change this to render a template
    res.status(404).json({
      success: false,
      error: `Page '${req.originalUrl}' not found`,
      message: 'The page you are looking for does not exist.'
    });
  }
};

module.exports = notFound;