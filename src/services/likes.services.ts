import { ObjectId } from 'mongodb'
import databaseServices from './database.services'
import Bookmark from '~/models/schemas/Bookmark.schema'

class LikesServices {
  async like(user_id: string, tweet_id: string) {
    const result = await databaseServices.likes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Bookmark({ user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    return result
  }

  async Unlike(tweet_id: string) {
    const result = await databaseServices.likes.findOneAndDelete({
      tweet_id: new ObjectId(tweet_id)
    })

    return result
  }
}

const likesServices = new LikesServices()
export default likesServices
