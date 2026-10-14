import type { NextFunction, Request, Response } from "express";

interface IError extends Error {
    statusCode: number;
}
function globalErrHandlingMiddleware (
        err: IError,
        req: Request,
        res: Response,
        next: NextFunction,
    ){
      res.status(err.statusCode || 400).json({
          errMsg: err.message,
          cause: err.cause,
          err,
          stack: err.stack,
          
        });
    }


export default globalErrHandlingMiddleware;