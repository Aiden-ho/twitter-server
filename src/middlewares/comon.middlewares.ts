import pick from 'lodash/pick'
import { Request, Response, NextFunction } from 'express'

//type này có key là type T truyền vào
type filterKeys<T> = Array<keyof T>

export const filterMiddleware =
  <T>(filterKeys: filterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)

    next()
  }
