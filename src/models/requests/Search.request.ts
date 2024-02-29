import { ParamsDictionary } from 'express-serve-static-core'
import { PaginationReqQuery } from './Tweet.request'
import { MediaTypeQuery } from '~/constants/enum'

export interface SearchTextReqQuery extends PaginationReqQuery {
  content: string
  media_type: MediaTypeQuery
  people_followed: string
}

export interface SearchHashTAgReqParams extends ParamsDictionary {
  hashtag: string
}

export interface SearchHashTagReqQuery extends PaginationReqQuery {
  media_type: MediaTypeQuery
  people_followed: string
}
