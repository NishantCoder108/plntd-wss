import { NextFunction, Request, Response } from "express";
import { AUTH_WEBHOOK_HEADERS } from "./env";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authoString = req.headers.authorization;
  console.log("Autho string", authoString);
  if (!authoString || authoString !== AUTH_WEBHOOK_HEADERS) {
    res.status(401).json({ message: "Unauthorized" });

    return;
  }
  next();
};

export const removeConsole = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === "production") {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
  }

  next();
};
