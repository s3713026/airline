import { IApiResponse } from "@/types/interfaces";
import { NextFunction, Request, Response } from "express";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.session.user?.isAuthenticated) {
    res.status(401).json({
      success: false,
      error: "Chưa đăng nhập",
      message: "Vui lòng đăng nhập để tiếp tục",
    } as IApiResponse<never>);
    return;
  }
  next();
};
