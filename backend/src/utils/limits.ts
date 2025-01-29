import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

export const pollLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit 10 requests per minute
  handler: (req: Request, res: Response, next: NextFunction) => {
    res
      .status(429)
      .json({ error: 'Too many poll creations. Try again later.' });
  },
});

export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit 30 votes per minute
  handler: (req: Request, res: Response, next: NextFunction) => {
    res.status(429).json({ error: 'Too many votes. Slow down!' });
  },
});
