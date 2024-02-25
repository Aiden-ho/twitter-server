import { ParamsDictionary } from 'express-serve-static-core'

export interface LikeReqBody {
  tweet_id: string
}

export interface UnLikeReqParams {
  tweet_id: string
}
