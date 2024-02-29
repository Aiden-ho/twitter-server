import { ObjectId } from 'mongodb'
import databaseServices from './database.services'
import Follower from '~/models/schemas/Follower.schema'

class FollowerServices {
  async getFollowedUsers(user_id: string) {
    const result = await databaseServices.followers
      .find(
        { user_id: new ObjectId(user_id) },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray()
    const followers = result.map((item) => item.followed_user_id)
    return followers
  }
  async checkFollowed(user_id: string, followed_user_id: string) {
    const result = await databaseServices.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    return Boolean(result)
  }

  async save(user_id: string, followed_user_id: string) {
    await databaseServices.followers.insertOne(
      new Follower({ user_id: new ObjectId(user_id), followed_user_id: new ObjectId(followed_user_id) })
    )
  }

  async delete(user_id: string, followed_user_id: string) {
    await databaseServices.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
  }
}

const followerServices = new FollowerServices()
export default followerServices
