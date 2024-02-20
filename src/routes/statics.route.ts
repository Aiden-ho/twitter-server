import { Router } from 'express'
import { serveImageController, serveVideoController } from '~/controllers/statics.controller'

const staticRouter = Router()

staticRouter.get('/image/:filename', serveImageController)

staticRouter.get('/video/:filename', serveVideoController)

export default staticRouter
