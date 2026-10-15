import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers?.authorization;

  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Please sign in to continue.',
    });
  }

  const token = header.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      error: 'Please sign in to continue.',
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({
      error: 'Your session has expired. Please sign in again.',
    });
  }
}

