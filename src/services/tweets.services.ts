import { CreateTweetReqBody } from '~/models/requests/Tweet.request'
import databaseServices from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId } from 'mongodb'
import hashtagServices from './hashtags.services'

class TweetServices {
  async save(user_id: string, body: CreateTweetReqBody) {
    const hashtags = await hashtagServices.checkAndCreate(body.hashtags)
    const result = await databaseServices.tweets.insertOne(
      new Tweet({
        user_id: new ObjectId(user_id),
        type: body.type,
        audience: body.audience,
        content: body.content,
        parent_id: body.parent_id,
        hashtags,
        mentions: body.mentions,
        medias: body.medias
      })
    )

    const tweet = await this.get(result.insertedId)

    return tweet
  }

  async get(tweet_id: ObjectId) {
    const result = await databaseServices.tweets.findOne({ _id: tweet_id })
    return result
  }
}

const tweetServices = new TweetServices()
export default tweetServices
