import { TweetAudience, TweetType } from '~/constants/enum'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { Media } from '../Others'

export interface CreateTweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string //  chỉ null khi tweet gốc
  hashtags: string[]
  mentions: string[]
  medias: Media[]
}

export interface GetTweetReqParams extends ParamsDictionary {
  tweet_id: string
}

export interface GetTweetReqQuery extends Query, PaginationReqQuery {
  tweet_type: string
}
export interface PaginationReqQuery extends Query {
  page: string
  limit: string
  tweet_type: string
}
