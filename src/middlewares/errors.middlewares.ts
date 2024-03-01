import { Request, Response, NextFunction } from 'express'
import omit from 'lodash/omit'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const ErrorDefaultHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (error instanceof ErrorWithStatus) {
      return res.status(error.status).json(omit(error, ['status']))
    }

    const finalError: any = {}

    Object.getOwnPropertyNames(error).forEach((key) => {
      if (
        !Object.getOwnPropertyDescriptor(error, key)?.configurable ||
        !Object.getOwnPropertyDescriptor(error, key)?.writable
      ) {
        return
      }
      finalError[key] = error[key]
    })

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error.message,
      error_info: omit(finalError, ['stack'])
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Interval server error',
      error_info: omit(error as any, ['stack'])
    })
  }
}
