import { Request, Response } from "express";

export const listTerms = async (_req: Request, res: Response) => {
  res.status(501).json({ message: "Not implemented" });
};
