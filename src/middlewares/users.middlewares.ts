import { Request, Response, NextFunction } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/constants/config'
import { UserVerifyStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regexs'
import { ErrorWithStatus } from '~/models/Errors'
import { PayloadToken } from '~/models/requests/User.request'
import refreshTokensServices from '~/services/refreshTokens.services'
import userServices from '~/services/users.services'
import { verifyAccessToken } from '~/utils/common'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import validationRunner from '~/utils/validation-runner'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false
    },
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}

const getConfirmPasswordSchema = (key: string): ParamSchema => {
  return {
    notEmpty: true,
    isString: true,
    trim: true,
    custom: {
      options: (value, { req }) => {
        if (value !== req.body[key]) {
          throw new Error(USER_MESSAGES.CONFIRM_PASSWORD_IS_NOT_MATCH)
        }
        return true
      }
    }
  }
}

const forgotPasswordSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      try {
        //check empty forgot_password_token with custom error
        if (!value) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }

        //Verify token
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretKey: envConfig.jwtSecretForgotPasswordToken
        })

        const { user_id } = decoded_forgot_password_token

        // get user by user_id in verify result
        const user = await userServices.getUser({ _id: user_id })

        if (!user) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        // compare token in db and body
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token

        return true
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }

        throw error
      }
    }
  }
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_A_ISO861
  }
}

const emailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
  },
  trim: true
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
  },
  trim: true
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.IMAGE_URL_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USER_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400
  }
}

const idUserSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.USER_ID_IS_INVALID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      const followed_user = await userServices.getUser({ _id: value })

      if (!followed_user) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      return true
    }
  }
}

export const loginValidator = validationRunner(
  checkSchema(
    {
      email: emailSchema,
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        custom: {
          options: async (value, { req }) => {
            const email = req.body.email
            const user = await userServices.getUser({ email, password: value })

            if (!user) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            ;(req as Request).user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validationRunner(
  checkSchema(
    {
      name: nameSchema,
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const isEmailExist = await userServices.checkEmailExist(value)
            if (isEmailExist) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: getConfirmPasswordSchema('password'),
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validationRunner(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            return await verifyAccessToken(value, req as Request)
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validationRunner(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            try {
              //check empty refresh token with custom error
              if (!value) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              //verufy refresh token
              const [decoded_refesh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretKey: envConfig.jwtSecretRefreshToken }),
                refreshTokensServices.get(value)
              ])
              //check refresh token is in DB
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXISTS,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              //add decode token to req
              ;(req as Request).decoded_refesh_token = decoded_refesh_token

              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.ACCESS_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const verifyEmailValidator = validationRunner(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            try {
              //check empty email_verify_token with custom error
              if (!value) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretKey: envConfig.jwtSecretEmailVerifyToken
              })

              //add decode token to req
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token

              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validationRunner(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await userServices.getUser({ email: value })

            if (!user) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            ;(req as Request).user = user

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordValidator = validationRunner(
  checkSchema(
    {
      forgot_password_token: forgotPasswordSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validationRunner(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: getConfirmPasswordSchema('password'),
      forgot_password_token: forgotPasswordSchema
    },
    ['body']
  )
)

export const verifyUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as PayloadToken

  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDEN
      })
    )
  }

  next()
}

export const updateMeValidator = validationRunner(
  checkSchema(
    {
      name: {
        ...nameSchema,
        notEmpty: false,
        optional: true
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.BIO_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USER_MESSAGES.BIO_LENGTH_MUST_BE_FROM_1_TO_200
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.LOCATION_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USER_MESSAGES.LOCATION_LENGTH_MUST_BE_FROM_1_TO_200
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.WEBSITE_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USER_MESSAGES.WEBSITE_LENGTH_MUST_BE_FROM_1_TO_200
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.USERNAME_MUST_BE_STRING
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!REGEX_USERNAME.test(value)) {
              throw new Error(USER_MESSAGES.USERNAME_IS_INVALID)
            }
            const { user_id } = req.decoded_authorization as PayloadToken
            const user = await userServices.getUser({ username: value })

            if (user) {
              if (user._id.toString() === user_id) {
                throw new Error(USER_MESSAGES.USERNAME_MUST_BE_DIFFERENT_FROM_THE_CURRENT)
              } else {
                throw new Error(USER_MESSAGES.USERNAME_IS_ALREADY_EXISTS)
              }
            }

            return true
          }
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const followerValidator = validationRunner(
  checkSchema(
    {
      followed_user_id: idUserSchema
    },
    ['body']
  )
)

export const unfollowerValidator = validationRunner(
  checkSchema(
    {
      user_id: idUserSchema
    },
    ['params']
  )
)

export const changePasswordValidator = validationRunner(
  checkSchema(
    {
      old_password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = (req as Request).decoded_authorization as PayloadToken
            const user = await userServices.getFullUser(user_id)

            if (!user) {
              throw new ErrorWithStatus({ message: USER_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
            }

            if (user.password !== hashPassword(value)) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.OLD_PASSWORD_INCORRECT,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            return true
          }
        }
      },
      new_password: passwordSchema,
      confirm_new_password: getConfirmPasswordSchema('new_password')
    },
    ['body']
  )
)

export const receiverIdValidator = validationRunner(
  checkSchema(
    {
      receiver_id: idUserSchema
    },
    ['params']
  )
)

//Kiểm tra xem đã login chưa mới chạy middleware
// Dành cho những endpoint log in hay ko cũng xài được
export const isLogedInValidator =
  (middleware: (req: Request, res: Response, next: NextFunction) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next)
    }

    next()
  }
