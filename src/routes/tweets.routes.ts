import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweets.controller'
import { tweetAudienceValidator, tweetIdValidator, tweetValidator } from '~/middlewares/tweets.middlewares'
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
 * Path: /
 * Method: GET
 * header: bearer access_token (optional)
 * params: tweet_id
 **/
tweetsRouter.get(
  '/:tweet_id',
  isLogedInValidator(accessTokenValidator),
  isLogedInValidator(verifyUserValidator),
  tweetIdValidator,
  tweetAudienceValidator,
  wrapperRequestHandler(getTweetController)
)

export default tweetsRouter
