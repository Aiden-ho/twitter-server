export interface ServeImageReqParams {
  filename: string
}

export interface ServeM3u8ReqParams {
  id: string
}

export interface ServeSegmentReqParams {
  id: string
  v: string
  segment: string
}
