import { body, validationResult, ContextRunner, ValidationChain } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { ErrorEntity, ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

// Runner for schema validation
// sequential processing, stops running validations chain if the previous one fails.
const validationRunner = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //run schema validation
    await validations.run(req)

    //get error for req
    const errors = validationResult(req)

    //if have no error then next
    if (errors.isEmpty()) {
      return next()
    }

    const errorsObject = errors.mapped()
    const errorLenght = Object.keys(errorsObject).length
    const errorEntity = new ErrorEntity({ message: 'invalid value', errors: {} })

    for (const key in errorsObject) {
      const { msg } = errorsObject[key]

      if (errorLenght === 1 && msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }

      errorEntity.errors[key] = errorsObject
    }

    //return object error for client
    res.status(422).json({ errors: errorsObject })
  }
}

export default validationRunner
