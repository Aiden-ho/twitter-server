import { Request } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { verifyToken } from './jwt'
import { JsonWebTokenError } from 'jsonwebtoken'
import { envConfig } from '~/constants/config'

export const convertNumberEnumToArray = (target: { [key: string]: string | number }) => {
  return Object.values(target).filter((value) => typeof value === 'number') as number[]
}

export const covertStringEnumToArray = (target: { [key: string]: string }) => {
  return Object.values(target)
}

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  try {
    //check empty access token with custom error
    if (!access_token) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    //verify access token
    access_token = access_token.replace('Bearer ', '')
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretKey: envConfig.jwtSecretAccessToken
    })
    if (req) {
      //add decode token to req
      ;(req as Request).decoded_authorization = decoded_authorization
      return true
    }

    return decoded_authorization
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
