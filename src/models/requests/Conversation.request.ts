import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface getConversationsReqParams extends ParamsDictionary {
  receiver_id: string
}

export interface getConversationsReqQuery extends Query {
  page: string
  limit: string
}
