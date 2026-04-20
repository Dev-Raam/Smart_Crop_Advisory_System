import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No auth token, access denied' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production');
    req.user = verified.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token verification failed, authorization denied' });
  }
};
