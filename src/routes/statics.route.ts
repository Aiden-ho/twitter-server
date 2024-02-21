import { Router } from 'express'
import { serveImageController, serveVideoStreamingController } from '~/controllers/statics.controller'

const staticRouter = Router()

staticRouter.get('/image/:filename', serveImageController)

staticRouter.get('/video-streaming/:filename', serveVideoStreamingController)

export default staticRouter
