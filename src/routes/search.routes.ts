import { Router } from 'express'
import { searchByHashTagController, searchByTextController } from '~/controllers/search.controllers'
import { searchHashTagValidator, searchTextValidator } from '~/middlewares/search.middlwares'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapperRequestHandler } from '~/utils/handlers'

const searchRouter = Router()

/**
 * search tweet by content
 *
 * Path: /
 * Method: GET
 * header: bearer access_token
 * query: content, media_type?, people_followed?, limit, page
 **/
searchRouter.get(
  '/',
  paginationValidator,
  searchTextValidator,
  accessTokenValidator,
  verifyUserValidator,
  wrapperRequestHandler(searchByTextController)
)

/**
 * search tweet by hashtag
 *
 * Path: /
 * Method: GET
 * header: bearer access_token
 * query: hashtag, media_type?, people_followed?, limit, page
 **/
searchRouter.get(
  '/hashtag/:hashtag',
  paginationValidator,
  searchHashTagValidator,
  accessTokenValidator,
  verifyUserValidator,
  wrapperRequestHandler(searchByHashTagController)
)

export default searchRouter
