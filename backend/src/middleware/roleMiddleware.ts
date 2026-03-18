import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (!req.user?.isAdmin && role !== 'admin' && role !== 'super_admin') {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

export const officer = (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (!(role === "officer" || req.user?.isAdmin)) {
    return res.status(403).json({ message: "Officers only" });
  }
  next();
};

export const dean = (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (!(role === "dean" || req.user?.isAdmin)) {
    return res.status(403).json({ message: "Dean only" });
  }
  next();
};
