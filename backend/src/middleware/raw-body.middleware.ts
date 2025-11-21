import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req['rawBody'] = req.body;
    next();
  }
}

export function JsonBodyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.body && req.body.toString) {
    try {
      req.body = JSON.parse(req.body.toString());
    } catch (e) {
      // If parsing fails, keep the raw body
      req.body = req.body.toString();
    }
  }
  next();
}
