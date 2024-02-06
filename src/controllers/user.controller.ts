import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import {
  LogoutReqBody,
  RegsiterReqBody,
  PayloadToken,
  VerifyEmailReqBody,
  LoginReqBody,
  ForgotPasswordReqBody,
  VerifyForgotPasswordReqBody,
  ResetPasswordReqBody,
  UpdateUserReqBody,
  GetProfileReqParams,
  FollowReqBody,
  UnFollowReqParams
} from '~/models/requests/User.request'
import User from '~/models/schemas/User.schema'
import followerServices from '~/services/followers.services'
import refreshTokensServices from '~/services/refreshTokens.services'
import userServices from '~/services/users.services'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userServices.login({ user_id: user_id.toString(), verify: user.verify })

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

  const user = await userServices.getUser({ _id: user_id })

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

export const resendVerifyEmailController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as PayloadToken

  const user = await userServices.getUser({ _id: user_id })

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.USER_NOT_FOUND
    })
  }

  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USER_MESSAGES.EMAIL_IS_VERIFIED
    })
  }

  const result = await userServices.resendVerifyEmail(user_id)

  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userServices.forgotPassword({ user_id: user_id.toString(), verify: user.verify })

  return res.json(result)
}

export const verifyForgotpasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response
) => {
  return res.json({
    message: USER_MESSAGES.FORGOT_PASSWORD_VERIFY_SUCCESSFUL
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as PayloadToken
  const { password } = req.body

  const result = await userServices.resetPassword(user_id, password)

  return res.json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const result = await userServices.getUser({ _id: user_id })
  return res.json({
    message: USER_MESSAGES.GET_ME_SUCCESSFUL,
    result
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateUserReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const { body } = req
  const user = await userServices.updateUser(user_id, body)
  return res.json({
    message: USER_MESSAGES.UPDATE_ME_SUCCESSFUL,
    result: user
  })
}

export const getUserController = async (req: Request<GetProfileReqParams>, res: Response) => {
  const { user_name } = req.params
  const result = await userServices.getUser({ username: user_name })

  if (!result) {
    throw new ErrorWithStatus({ message: USER_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
  }

  return res.json({
    message: USER_MESSAGES.GET_PROFILE_SUCCESSFUL,
    result
  })
}

export const followUserController = async (req: Request<ParamsDictionary, any, FollowReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const { followed_user_id } = req.body

  const isFollowed = await followerServices.checkFollowed(user_id, followed_user_id)

  if (isFollowed) {
    return res.json({ message: USER_MESSAGES.ALREADY_FOLLOWED })
  }

  await followerServices.save(user_id, followed_user_id)

  return res.json({ message: USER_MESSAGES.FOLLOW_SUCCESSFUL })
}

export const unFollowUserController = async (req: Request<UnFollowReqParams>, res: Response) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const { user_id: followed_user_id } = req.params
  const isFollowed = await followerServices.checkFollowed(user_id, followed_user_id)

  if (!isFollowed) {
    return res.json({ message: USER_MESSAGES.ALREADY_UNFOLLOWED })
  }

  await followerServices.delete(user_id, followed_user_id)

  return res.json({ message: USER_MESSAGES.UNFOLLOW_SUCCESSFUL })
}
