import { RegsiterReqBody } from '~/models/requests/User.request'
import databaseServices from './database.services'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import refreshTokensServices from './refreshTokens.services'
import { ObjectId } from 'mongodb'

class UserServices {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      privateKey: process.env.JWT_SERCRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRED }
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      privateKey: process.env.JWT_SERCRET_REFRESH_TOKEN as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRED }
    })
  }
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerifyToken },
      privateKey: process.env.JWT_SERCRET_EMAIL_VERIFY_TOKEN as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRED }
    })
  }

  private signTokens(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  async register(payload: RegsiterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    await databaseServices.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    )

    const [access_token, refresh_token] = await this.signTokens(user_id.toString())

    refreshTokensServices.save(user_id.toString(), refresh_token as string)
    console.log('email_verify_token', email_verify_token)

    return {
      access_token,
      refresh_token
    }
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signTokens(user_id)
    refreshTokensServices.save(user_id, refresh_token as string)
    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExist(email: string) {
    const user = await databaseServices.users.findOne({ email })
    return Boolean(user)
  }

  async getUser(email: string, password: string) {
    const user = await databaseServices.users.findOne({ email, password: hashPassword(password) })
    return user
  }

  async getUserbyId(user_id: string) {
    const user = await databaseServices.users.findOne({ _id: new ObjectId(user_id) })
    return user
  }

  async verifyEmail(user_id: string) {
    const [tokens] = await Promise.all([
      this.signTokens(user_id),
      databaseServices.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: { email_verify_token: '', verify: UserVerifyStatus.Verified, updated_at: new Date() }
        }
      )
    ])
    const [access_token, refresh_token] = tokens
    return {
      access_token,
      refresh_token
    }
  }
}

const userServices = new UserServices()
export default userServices
