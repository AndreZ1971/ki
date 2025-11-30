// WooCommerce Auth Middleware
// Prüft, ob Consumer Key und Secret im Request vorhanden und korrekt sind

import { Request, Response, NextFunction } from 'express';

export function wooAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-woocommerce-key'] || req.query.consumer_key;
  const secret = req.headers['x-woocommerce-secret'] || req.query.consumer_secret;
  if (
    key === process.env.WOOCOMMERCE_CONSUMER_KEY &&
    secret === process.env.WOOCOMMERCE_CONSUMER_SECRET
  ) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}
