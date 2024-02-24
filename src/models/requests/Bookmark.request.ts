import { ParamsDictionary } from 'express-serve-static-core'

export interface BookmarkReqBody {
  tweet_id: string
}

export interface UnbookmarkReqParams extends ParamsDictionary {
  tweet_id: string
}
