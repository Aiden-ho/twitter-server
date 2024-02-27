import { Router } from 'express'
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controller'
import {
  paginationValidator,
  tweetAudienceValidator,
  tweetChildrenValidator,
  tweetIdValidator,
  tweetValidator
} from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isLogedInValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapperRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Create tweet
 *
 * Path: /
 * Method: POST
 * header: bearer access_token
 * body: Tweet
 **/
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  tweetValidator,
  wrapperRequestHandler(createTweetController)
)

/**
 * Get tweet
 *
 * Path: /:tweet_id/detail
 * Method: GET
 * header: bearer access_token (optional)
 * params: tweet_id
 **/
tweetsRouter.get(
  '/:tweet_id/detail',
  isLogedInValidator(accessTokenValidator),
  isLogedInValidator(verifyUserValidator),
  tweetIdValidator,
  tweetAudienceValidator,
  wrapperRequestHandler(getTweetController)
)

/**
 * Get tweet children
 *
 * Path: /:tweet_id/children
 * Method: GET
 * header: bearer access_token (optional)
 * params: parent_id
 * query: limit, page, tweet_type
 **/
tweetsRouter.get(
  '/:tweet_id/children',
  paginationValidator,
  isLogedInValidator(accessTokenValidator),
  isLogedInValidator(verifyUserValidator),
  tweetIdValidator,
  tweetAudienceValidator,
  tweetChildrenValidator,
  wrapperRequestHandler(getTweetChildrenController)
)

/**
 * Get new feed
 *
 * Path: /new-feed
 * Method: GET
 * header: bearer access_token
 * query: limit, page
 **/
tweetsRouter.get(
  '/new-feeds',
  paginationValidator,
  accessTokenValidator,
  verifyUserValidator,
  wrapperRequestHandler(getNewFeedsController)
)

export default tweetsRouter
