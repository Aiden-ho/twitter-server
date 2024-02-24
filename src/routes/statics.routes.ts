import { Router } from 'express'
import {
  serveImageController,
  serveM3u8Controller,
  serveSegmentController,
  serveVideoStreamingController
} from '~/controllers/statics.controller'

const staticRouter = Router()

staticRouter.get('/image/:filename', serveImageController)

staticRouter.get('/video-streaming/:filename', serveVideoStreamingController)

staticRouter.get('/video-hls/:id/master.m3u8', serveM3u8Controller)

staticRouter.get('/video-hls/:id/:v/:segment', serveSegmentController)

export default staticRouter
