import { MongoClient, Db, Collection } from 'mongodb'
import { envConfig } from '~/constants/config'
import Bookmark from '~/models/schemas/Bookmark.schema'
import Conversation from '~/models/schemas/Conversation.schema'
import Follower from '~/models/schemas/Follower.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Like from '~/models/schemas/Like.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import User from '~/models/schemas/User.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'

const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@twitter.iap5xxj.mongodb.net/?retryWrites=true&w=majority`

class DatabaseServices {
  private client: MongoClient
  private db: Db

  constructor() {
    // Create a MongoClient
    this.client = new MongoClient(uri)
    this.db = this.client.db(envConfig.dbName)
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.client.db('admin').command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      // show all properties of error in log
      console.dir(error)
      // Ensures that the client will close when you finish/error
      //await this.client.close()
    }
  }

  async indexUser() {
    const exist = await this.users.indexExists(['email_1', 'username_1', 'email_1_password_1'])
    if (!exist) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshToken() {
    const exist = await this.refreshTokens.indexExists(['epx_1', 'token_1'])
    if (!exist) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ epx: 1 }, { expireAfterSeconds: 0 }) // hết hạn thì xóa dựa theo epx
    }
  }

  async indexVideosStatus() {
    const exist = await this.videosStatus.indexExists(['name_1'])
    if (!exist) {
      this.videosStatus.createIndex({ name: 1 })
    }
  }

  async indexFollowers() {
    const exist = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    if (!exist) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }

  async indexTweets() {
    const exist = await this.tweets.indexExists(['content_text'])
    if (!exist) {
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }

  async indexHashTags() {
    const exist = await this.hashtags.indexExists(['name_text'])
    if (!exist) {
      this.hashtags.createIndex({ name: 'text' })
    }
  }

  async indexConversation() {
    const exist = await this.conversations.indexExists(['sender_id_1_receiver_id_1'])
    if (!exist) {
      this.conversations.createIndex({ sender_id: 1, receiver_id: 1 })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUserCollection)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokenCollection)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowersCollection)
  }

  get videosStatus(): Collection<VideoStatus> {
    return this.db.collection(envConfig.dbVideosStatusCollection)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(envConfig.dbTweetsCollection)
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(envConfig.dbHashtagsCollection)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(envConfig.dbBookmarksCollection)
  }

  get likes(): Collection<Like> {
    return this.db.collection(envConfig.dbLikesCollection)
  }

  get conversations(): Collection<Conversation> {
    return this.db.collection(envConfig.dbConversationsCollection)
  }
}

const databaseServices = new DatabaseServices()
export default databaseServices
