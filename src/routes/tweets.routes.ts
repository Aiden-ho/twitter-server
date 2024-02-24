import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controller'
import { tweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
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

export default tweetsRouter
