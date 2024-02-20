import { Request, Response } from 'express'
import { USER_MESSAGES } from '~/constants/messages'
import mediasServices from '~/services/medias.services'

export const uploadImagesController = async (req: Request, res: Response) => {
  const result = await mediasServices.handlerUploadImages(req)
  res.json({ message: USER_MESSAGES.UPLOAD_IMAGES_SUCCESSFUL, result })
}

export const uploadVideosController = async (req: Request, res: Response) => {
  const result = await mediasServices.handlerUploadVideos(req)
  res.json({ message: USER_MESSAGES.UPLOAD_VIDEO_SUCCESSFUL, result })
}
