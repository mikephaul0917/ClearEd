import { Request, Response } from "express";

export const setupRequirement = async (_req: Request, res: Response) => {
  res.status(501).json({ message: "Not implemented" });
};
