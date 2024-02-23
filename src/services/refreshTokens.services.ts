import { ObjectId } from 'mongodb'
import databaseServices from './database.services'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { verifyToken } from '~/utils/jwt'
import { PayloadToken } from '~/models/requests/User.request'

class RefreshTokensServices {
  private decodeRefreshToken(token: string) {
    return verifyToken({ token, secretKey: process.env.JWT_SERCRET_REFRESH_TOKEN as string })
  }

  async save(user_id: string, token: string) {
    const { exp, iat } = (await this.decodeRefreshToken(token)) as PayloadToken
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token, iat, exp })
    )
  }
  async get(token: string) {
    const result = await databaseServices.refreshTokens.findOne({ token })
    return result
  }
  async delete(token: string) {
    await databaseServices.refreshTokens.deleteOne({ token })
  }
}

const refreshTokensServices = new RefreshTokensServices()
export default refreshTokensServices
