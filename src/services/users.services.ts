import axios from 'axios'
import isEmpty from 'lodash/isEmpty'
import { RegisterReqBody, UpdateUserReqBody } from '~/models/requests/User.request'
import databaseServices from './database.services'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import refreshTokensServices from './refreshTokens.services'
import { ObjectId } from 'mongodb'
import { USER_MESSAGES } from '~/constants/messages'
import { sendEmailForgotPassword, sendVerifyEmailRegister } from '~/utils/send-email'
import { envConfig } from '~/constants/config'

class UserServices {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      privateKey: envConfig.jwtSecretAccessToken,
      options: { expiresIn: envConfig.accessTokenExpired }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify, ...(exp && { exp }) },
      privateKey: envConfig.jwtSecretRefreshToken,
      ...(!exp && { options: { expiresIn: envConfig.refreshTokenExpired } })
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      privateKey: envConfig.jwtSecretEmailVerifyToken,
      options: { expiresIn: envConfig.emailVerifyTokenExpired }
    })
  }

  private signforgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      privateKey: envConfig.jwtSecretForgotPasswordToken,
      options: { expiresIn: envConfig.forgotPasswordTokenExpired }
    })
  }

  private signAccessAndRefreshTokens({
    user_id,
    verify,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    exp?: number
  }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify, exp })])
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: envConfig.googleClientId,
      client_secret: envConfig.googleClientSecret,
      redirect_uri: envConfig.googleRedirectUri,
      access_type: 'offline',
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUser(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        id_token,
        alt: 'json'
      },
      headers: {
        Authorization: 'Bearer ' + access_token
      }
    })

    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      picture: string
    }
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseServices.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user_${user_id.toString()}`,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    )

    const [access_token, refresh_token] = await this.signAccessAndRefreshTokens({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    refreshTokensServices.save(user_id.toString(), refresh_token as string)

    //send email
    await sendVerifyEmailRegister({ email: payload.email, email_verify_token: email_verify_token })

    return {
      access_token,
      refresh_token
    }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshTokens({ user_id, verify })
    refreshTokensServices.save(user_id, refresh_token as string)
    return {
      access_token,
      refresh_token
    }
  }

  async refreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshTokens({ user_id, verify, exp })

    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExist(email: string) {
    const user = await databaseServices.users.findOne({ email })
    return Boolean(user)
  }

  async getUser({
    _id,
    email,
    password,
    username
  }: {
    _id?: string
    email?: string
    password?: string
    username?: string
  }) {
    const query = {
      ...(_id && { _id: new ObjectId(_id) }),
      ...(email && { email }),
      ...(username && { username }),
      ...(password && { password: hashPassword(password) })
    }

    if (isEmpty(query)) {
      return null
    }

    const user = await databaseServices.users.findOne(query, {
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    })
    return user
  }

  async getFullUser(user_id: string) {
    const user = await databaseServices.users.findOne({ _id: new ObjectId(user_id) })
    return user
  }

  async verifyEmail(user_id: string) {
    const [tokens] = await Promise.all([
      this.signAccessAndRefreshTokens({ user_id, verify: UserVerifyStatus.Verified }),
      databaseServices.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: { email_verify_token: '', verify: UserVerifyStatus.Verified },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])
    const [access_token, refresh_token] = tokens
    refreshTokensServices.save(user_id, refresh_token as string)
    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })

    //send email
    await sendVerifyEmailRegister({ email, email_verify_token })

    //update lại token mới
    databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { email_verify_token },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return {
      message: USER_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS
    }
  }

  async forgotPassword({ user_id, verify, email }: { user_id: string; verify: UserVerifyStatus; email: string }) {
    const forgot_password_token = await this.signforgotPasswordToken({ user_id, verify })

    //update lại token mới
    databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { forgot_password_token },
        $currentDate: {
          updated_at: true
        }
      }
    )

    //send email
    await sendEmailForgotPassword({ email, forgot_password_token })

    return {
      message: USER_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USER_MESSAGES.RESET_PASSWORD_SUCCESSFUL
    }
  }

  async updateUser(user_id: string, payload: UpdateUserReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const result = await databaseServices.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      { $set: { ...(_payload as UpdateUserReqBody & { date_of_birth: Date }) }, $currentDate: { updated_at: true } },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    return result
  }

  async changePassword(user_id: string, new_password: string) {
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { password: hashPassword(new_password) } }
    )
  }

  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    const user = await this.getGoogleUser(access_token, id_token)
    return user
  }
}

const userServices = new UserServices()
export default userServices
