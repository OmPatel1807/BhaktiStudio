/**
 * Global Express error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Handle Express body-parser entity too large error (413)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Uploaded file or image payload is too large. Maximum allowed size is 50MB.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
