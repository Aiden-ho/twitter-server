import { Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import { USER_MESSAGES } from '~/constants/messages'

export const serveImageController = (req: Request, res: Response) => {
  const { filename } = req.params

  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, filename), (error) => {
    if (error) {
      res.status((error as any).status).send(USER_MESSAGES.NOT_FOUND)
    }
  })
}

export const serveVideoController = (req: Request, res: Response) => {
  const { filename } = req.params

  return res.sendFile(path.resolve(UPLOAD_VIDEO_TEMP_DIR, filename), (error) => {
    if (error) {
      res.status((error as any).status).send(USER_MESSAGES.NOT_FOUND)
    }
  })
}
