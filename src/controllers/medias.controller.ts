import { Request, Response } from 'express'
import { USER_MESSAGES } from '~/constants/messages'
import { VideoStatusReqParams } from '~/models/requests/Media.request'
import mediasServices from '~/services/medias.services'
import videosStatusServices from '~/services/videosStatus.services'

export const uploadImagesController = async (req: Request, res: Response) => {
  const result = await mediasServices.handlerUploadImages(req)
  res.json({ message: USER_MESSAGES.UPLOAD_IMAGES_SUCCESSFUL, result })
}

export const uploadVideosController = async (req: Request, res: Response) => {
  const result = await mediasServices.handlerUploadVideos(req)
  res.json({ message: USER_MESSAGES.UPLOAD_VIDEO_SUCCESSFUL, result })
}

export const uploadVideosHLSController = async (req: Request, res: Response) => {
  const result = await mediasServices.handlerUploadVideosHLS(req)
  res.json({ message: USER_MESSAGES.UPLOAD_VIDEO_SUCCESSFUL, result })
}

export const getVideoStatusController = async (req: Request<VideoStatusReqParams>, res: Response) => {
  const { idName } = req.params
  const result = await videosStatusServices.get(idName)
  res.json({ message: USER_MESSAGES.GET_VIDEO_STATUS_SUCCESSFUL, result })
}
