import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEET_MESSAGES } from '~/constants/messages'
import { CreateTweetReqBody, GetTweetReqBody } from '~/models/requests/Tweet.request'
import { PayloadToken } from '~/models/requests/User.request'
import tweetServices from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, any, CreateTweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const result = await tweetServices.save(user_id, req.body)
  return res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESFUL,
    result
  })
}

export const getTweetController = async (req: Request<ParamsDictionary, any, GetTweetReqBody>, res: Response) => {
  const result = 'OK'
  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESSFUL,
    result
  })
}
