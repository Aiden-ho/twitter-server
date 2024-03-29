import { Request } from 'express'
import User from './models/schemas/User.schema'
import { PayloadToken } from './models/requests/User.request'
import Tweet from './models/schemas/Tweet.schema'

declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: PayloadToken
    decoded_refesh_token?: PayloadToken
    decoded_email_verify_token?: PayloadToken
    decoded_forgot_password_token?: PayloadToken
    tweet?: Tweet
  }
}
