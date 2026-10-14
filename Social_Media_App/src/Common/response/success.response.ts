import type { Response } from "express";

function successResponse<T>({
  res,
  statusCode = 200,
  msg = "Success",
  data,
}: {
  res: Response;
  statusCode?: number;
  msg?: string;
  data?: T;
}) {
  return res.status(statusCode).json({ msg, data });
}

export default successResponse;
