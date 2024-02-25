import { Router } from 'express'
import { likesController, unlikesController } from '~/controllers/likes.controller'
import { tweetIdValidator, tweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapperRequestHandler } from '~/utils/handlers'

const likesRouter = Router()

/**
 * Like tweet
 *
 * Path: /
 * Method: POST
 * header: bearer access_token
 * body: tweet_id
 **/
likesRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapperRequestHandler(likesController)
)

/**
 * Unlike tweet
 *
 * Path: /
 * Method: DELETE
 * header: bearer access_token
 * params: tweet_id
 **/
likesRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapperRequestHandler(unlikesController)
)

export default likesRouter
