import { ParamsDictionary } from 'express-serve-static-core'
export interface ServeImageReqParams {
  filename: string
}

export interface ServeVideoReqParams {
  filename: string
}
export interface VideoStatusReqParams extends ParamsDictionary {
  idName: string
}

export interface ServeM3u8ReqParams {
  id: string
}

export interface ServeSegmentReqParams {
  id: string
  v: string
  segment: string
}
