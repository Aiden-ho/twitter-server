import { ObjectId } from 'mongodb'
import databaseServices from './database.services'
import RefreshToken from '~/models/schemas/RefreshToken.schema'

class RefreshTokensServices {
  async save(user_id: string, token: string) {
    await databaseServices.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token }))
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
