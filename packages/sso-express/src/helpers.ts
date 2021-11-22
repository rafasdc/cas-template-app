import type { Request } from "express";

export const isAuthenticated = (req: Request) => !!req.session?.tokenSet;

export const getSessionRemainingTime = (req: Request) => {
  if (!isAuthenticated(req)) {
    return 0;
  }
  const { expires_at } = req.session.tokenSet;
  // A call to getGrant() will automatically refresh it at the same time.
  return Math.round(expires_at - Date.now() / 1000);
};
