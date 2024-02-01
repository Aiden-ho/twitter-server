import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { LogoutReqBody, RegsiterReqBody, PayloadToken, VerifyEmailReqBody } from '~/models/requests/User.request'
import User from '~/models/schemas/User.schema'
import refreshTokensServices from '~/services/refreshTokens.services'
import userServices from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userServices.login(user_id?.toString())

  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESSFUL,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegsiterReqBody>, res: Response) => {
  const result = await userServices.register(req.body)
  return res.json({
    message: USER_MESSAGES.REGISTER_SUCCESSFULL,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  await refreshTokensServices.delete(refresh_token)
  return res.json({
    message: USER_MESSAGES.LOGOUT_SUCCESSFULL
  })
}

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailReqBody>, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as PayloadToken

  const user = await userServices.getUserbyId(user_id)

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.USER_NOT_FOUND
    })
  }

  if (user.email_verify_token === '') {
    return res.json({
      message: USER_MESSAGES.EMAIL_VERIFY_SUCCESSFUL
    })
  }

  const result = await userServices.verifyEmail(user_id)

  return res.json({
    message: USER_MESSAGES.EMAIL_VERIFY_SUCCESSFUL,
    result
  })
}
