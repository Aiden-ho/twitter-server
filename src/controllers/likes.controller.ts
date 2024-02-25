import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGES, LIKE_MESSAGES } from '~/constants/messages'
import { BookmarkReqBody, UnbookmarkReqParams } from '~/models/requests/Bookmark.request'
import { PayloadToken } from '~/models/requests/User.request'
import bookmarksServices from '~/services/bookmarks.services'

export const likesController = async (req: Request<ParamsDictionary, any, BookmarkReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const tweet_id = req.body.tweet_id
  const result = await bookmarksServices.bookmark(user_id, tweet_id)

  return res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESSFUL,
    result
  })
}

export const unlikesController = async (req: Request<UnbookmarkReqParams>, res: Response) => {
  const { tweet_id } = req.params
  await bookmarksServices.Unbookmark(tweet_id)

  return res.json({
    message: LIKE_MESSAGES.UNLIKE_SUCCESSFUL
  })
}
