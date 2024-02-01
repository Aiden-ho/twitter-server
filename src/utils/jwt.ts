import jwt, { SignOptions, JwtPayload, VerifyOptions } from 'jsonwebtoken'
import { reject } from 'lodash'
import { resolve } from 'node:path'
import { PayloadToken } from '~/models/requests/User.request'

export function signToken({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: SignOptions
}) {
  return new Promise<string>((resovle, reject) => {
    jwt.sign(payload, privateKey, options, function (err, token) {
      if (err) {
        throw reject(err)
      }
      return resovle(token as string)
    })
  })
}

export function verifyToken({
  token,
  secretKey,
  options = {}
}: {
  token: string
  secretKey: string
  options?: VerifyOptions
}) {
  return new Promise<PayloadToken>((resolve, reject) => {
    jwt.verify(token, secretKey, options, function (err, decoded) {
      if (err) {
        throw reject(err)
      }
      return resolve(decoded as PayloadToken)
    })
  })
}
