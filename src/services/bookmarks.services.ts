import { ObjectId } from 'mongodb'
import databaseServices from './database.services'
import Bookmark from '~/models/schemas/Bookmark.schema'

class BookmarksServices {
  async bookmark(user_id: string, tweet_id: string) {
    const result = await databaseServices.bookmarks.findOneAndUpdate(
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

  async Unbookmark(tweet_id: string) {
    const result = await databaseServices.bookmarks.findOneAndDelete({
      tweet_id: new ObjectId(tweet_id)
    })

    return result
  }
}

const bookmarksServices = new BookmarksServices()
export default bookmarksServices
