import { Modify } from '~/utils/types'
import Tweet from '../schemas/Tweet.schema'
import User from '../schemas/User.schema'
import Hashtag from '../schemas/Hashtag.schema'

export type MentionRes = Pick<User, '_id' | 'name' | 'username' | 'email'>

export interface tweetDetailRes
  extends Modify<
    Tweet,
    {
      hashtags: Hashtag[]
      mentions: MentionRes[] | []
    }
  > {
  bookmarks: number
  likes: number
  count_retweet: number
  count_coment: number
  count_quote: number
}

export interface NewFeedRes extends tweetDetailRes {
  user: Omit<User, 'password' | 'email_verify_token' | 'forgot_password_token' | 'date_of_birth' | 'twitter_circle'>
}
