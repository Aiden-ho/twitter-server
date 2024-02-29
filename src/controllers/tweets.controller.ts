import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enum'
import { TWEET_MESSAGES } from '~/constants/messages'
import {
  CreateTweetReqBody,
  GetTweetReqParams,
  GetTweetReqQuery,
  PaginationReqQuery
} from '~/models/requests/Tweet.request'
import { PayloadToken } from '~/models/requests/User.request'
import followerServices from '~/services/followers.services'
import tweetServices from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, any, CreateTweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const result = await tweetServices.save(user_id, req.body)
  return res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESFUL,
    result
  })
}

export const getTweetController = async (req: Request<GetTweetReqParams>, res: Response) => {
  const result = await tweetServices.increaseTweetView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    user_views: result.user_views,
    guest_views: result.guest_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESSFUL,
    result: tweet
  })
}

export const getTweetChildrenController = async (
  req: Request<GetTweetReqParams, any, any, GetTweetReqQuery>,
  res: Response
) => {
  const user_id = req.decoded_authorization?.user_id
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const tweet_type = Number(req.query.tweet_type) as TweetType

  const { total, tweets } = await tweetServices.getChildrenDetail({
    tweet_id: req.params.tweet_id,
    limit,
    page,
    tweet_type
  })

  const ids = tweets.map((item) => item._id) as ObjectId[]
  const date = new Date()
  await tweetServices.increaseTweetsView({ ids, updated_at: date, user_id })

  tweets.forEach((item) => {
    if (user_id) {
      item.user_views += 1
    } else {
      item.guest_views += 1
    }
  })

  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESSFUL,
    result: {
      tweets,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}

export const getNewFeedsController = async (
  req: Request<ParamsDictionary, any, any, PaginationReqQuery>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const follower_user_ids = await followerServices.getFollowedUsers(user_id)

  follower_user_ids.push(new ObjectId(user_id))

  const { tweets, total } = await tweetServices.getNewFeeds({ follower_user_ids, user_id, limit, page })

  const ids = tweets.map((item) => item._id) as ObjectId[]
  const date = new Date()
  await tweetServices.increaseTweetsView({ ids, updated_at: date, user_id })

  tweets.forEach((item) => {
    item.user_views += 1
  })
  res.json({
    message: TWEET_MESSAGES.GET_NEW_FEEDS_SUCCUSSFUL,
    result: {
      tweets,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}
