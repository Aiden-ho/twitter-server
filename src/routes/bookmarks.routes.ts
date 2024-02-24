import { Router } from 'express'
import { bookmarksController, unBookmarksController } from '~/controllers/bookmarks.controller'
import { tweetIdValidator, tweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapperRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()

/**
 * Bookmark tweet
 *
 * Path: /
 * Method: POST
 * header: bearer access_token
 * body: tweet_id
 **/
bookmarksRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapperRequestHandler(bookmarksController)
)

/**
 * UnBookmark tweet
 *
 * Path: /
 * Method: DELETE
 * header: bearer access_token
 * params: tweet_id
 **/
bookmarksRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapperRequestHandler(unBookmarksController)
)

export default bookmarksRouter
