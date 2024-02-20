import { Router } from 'express'
import { uploadImagesController, uploadVideosController } from '~/controllers/medias.controller'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapperRequestHandler } from '~/utils/handlers'

const mediasRouter = Router()

/**
 * upload images
 *
 * Path: /upload-images
 * Method: POST
 * body: form-data {image: file[]}
 **/
mediasRouter.post(
  '/upload-images',
  accessTokenValidator,
  verifyUserValidator,
  wrapperRequestHandler(uploadImagesController)
)

/**
 * upload videos
 *
 * Path: /upload-video
 * Method: POST
 * body: form-data {video: file}
 **/
mediasRouter.post(
  '/upload-video',
  accessTokenValidator,
  verifyUserValidator,
  wrapperRequestHandler(uploadVideosController)
)

export default mediasRouter
