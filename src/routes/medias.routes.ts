import { Router } from 'express'
import {
  getVideoStatusController,
  uploadImagesController,
  uploadVideosController,
  uploadVideosHLSController
} from '~/controllers/medias.controller'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapperRequestHandler } from '~/utils/handlers'

const mediasRouter = Router()

/**
 * upload images
 *
 * Path: /upload-images
 * Method: POST
 * header: bearer access_token
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
 * header: bearer access_token
 * body: form-data {video: file}
 **/
mediasRouter.post(
  '/upload-video',
  accessTokenValidator,
  verifyUserValidator,
  wrapperRequestHandler(uploadVideosController)
)

/**
 * upload videos hls
 *
 * Path: /upload-video-hls
 * Method: POST
 * header: bearer access_token
 * body: form-data {video: file}
 **/
mediasRouter.post(
  '/upload-video-hls',
  accessTokenValidator,
  verifyUserValidator,
  wrapperRequestHandler(uploadVideosHLSController)
)

/**
 * check status upload videos hls
 *
 * Path: /upload-video-hls
 * Method: GET
 * header: bearer access_token
 *
 **/
mediasRouter.get(
  '/video-status/:idName',
  accessTokenValidator,
  verifyUserValidator,
  wrapperRequestHandler(getVideoStatusController)
)

export default mediasRouter
