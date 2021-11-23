import type { Request } from "express";

export const isAuthenticated = (req: Request) => !!req.session?.tokenSet;

export const getSessionRemainingTime = (req: Request) => {
  if (!isAuthenticated(req)) {
    return 0;
  }
  const { expires_at } = req.session.tokenSet;
  return Math.round(expires_at - Date.now() / 1000);
};
