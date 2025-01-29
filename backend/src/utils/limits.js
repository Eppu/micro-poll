import { rateLimit } from 'express-rate-limit';

export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests, please slow down.',
});

export const pollLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: "You're creating too many polls. Please try again later.",
});
