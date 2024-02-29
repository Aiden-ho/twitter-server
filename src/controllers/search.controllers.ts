import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { MediaTypeQuery, PeopleFollowedQuery } from '~/constants/enum'
import { TWEET_MESSAGES } from '~/constants/messages'
import { SearchHashTAgReqParams, SearchHashTagReqQuery, SearchTextReqQuery } from '~/models/requests/Search.request'
import { PayloadToken } from '~/models/requests/User.request'
import followerServices from '~/services/followers.services'
import hashtagServices from '~/services/hashtags.services'
import tweetServices from '~/services/tweets.services'

export const searchByTextController = async (
  req: Request<ParamsDictionary, any, any, SearchTextReqQuery>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const content = req.query.content
  const media_type = req.query.media_type
  const people_followed = req.query.people_followed

  const searchQuery: any = {
    content,
    user_id,
    limit,
    page
  }

  if (media_type && (media_type === MediaTypeQuery.Image || media_type === MediaTypeQuery.Video)) {
    searchQuery['media_type'] = media_type
  }

  if (people_followed && people_followed === PeopleFollowedQuery.Followed) {
    searchQuery['people_followed'] = await followerServices.getFollowedUsers(user_id)
  }

  const { tweets, total } = await tweetServices.searchTweetsByText(searchQuery)

  const ids = tweets.map((item) => item._id) as ObjectId[]
  const date = new Date()
  await tweetServices.increaseTweetsView({ ids, updated_at: date, user_id })

  tweets.forEach((item) => {
    item.user_views += 1
  })

  res.json({
    message: TWEET_MESSAGES.SEARCH_SUCCUSSFUL,
    result: {
      tweets,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}

export const searchByHashTagController = async (
  req: Request<SearchHashTAgReqParams, any, any, SearchHashTagReqQuery>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const hashtag = req.params.hashtag
  const media_type = req.query.media_type
  const people_followed = req.query.people_followed

  const searchQuery: any = {
    hashtag,
    user_id,
    limit,
    page
  }

  if (media_type && (media_type === MediaTypeQuery.Image || media_type === MediaTypeQuery.Video)) {
    searchQuery['media_type'] = media_type
  }

  if (people_followed && people_followed === PeopleFollowedQuery.Followed) {
    searchQuery['people_followed'] = await followerServices.getFollowedUsers(user_id)
  }

  const { tweets, total } = await hashtagServices.searchTweetsByHashtag(searchQuery)

  const ids = tweets.map((item) => item._id) as ObjectId[]
  const date = new Date()
  await tweetServices.increaseTweetsView({ ids, updated_at: date, user_id })

  tweets.forEach((item) => {
    item.user_views += 1
  })

  res.json({
    message: TWEET_MESSAGES.SEARCH_SUCCUSSFUL,
    result: {
      tweets,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}
