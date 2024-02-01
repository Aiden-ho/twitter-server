import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { LogoutReqBody, RegsiterReqBody } from '~/models/requests/User.request'
import User from '~/models/schemas/User.schema'
import refreshTokensServices from '~/services/refreshTokens.services'
import userServices from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userServices.login(user_id?.toString())

  return res.json({
    message: 'Login successful',
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegsiterReqBody>, res: Response) => {
  const result = await userServices.register(req.body)
  return res.json({
    message: 'Register successful',
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  await refreshTokensServices.delete(refresh_token)
  return res.json({
    message: 'Logout successful'
  })
}
