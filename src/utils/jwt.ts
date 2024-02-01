import jwt, { SignOptions, JwtPayload, VerifyOptions } from 'jsonwebtoken'
import { reject } from 'lodash'
import { resolve } from 'node:path'
import { TokenPayload } from '~/models/requests/User.request'

export function signToken({
  payload,
  privateKey = process.env.JWT_SERCRET as string,
  options = { algorithm: 'HS256' }
}: {
  payload: string | Buffer | object
  privateKey?: string
  options?: SignOptions
}) {
  return new Promise((resovle, reject) => {
    jwt.sign(payload, privateKey, options, function (err, token) {
      if (err) {
        throw reject(err)
      }
      return resovle(token)
    })
  })
}

export function verifyToken({
  token,
  secretKey = process.env.JWT_SERCRET as string,
  options = {}
}: {
  token: string
  secretKey?: string
  options?: VerifyOptions
}) {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretKey, options, function (err, decoded) {
      if (err) {
        throw reject(err)
      }
      return resolve(decoded as TokenPayload)
    })
  })
}
