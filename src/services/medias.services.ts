import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { getNameFormFileName, uploadImages, uploadVideos } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { MediaType } from '~/constants/enum'
import { Media } from '~/models/Others'

class MediasServices {
  async handlerUploadImages(req: Request) {
    const files = await uploadImages(req)
    // xóa cache để không giữ file thì mới unlink được
    sharp.cache(false)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFormFileName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )

    return result
  }

  async handlerUploadVideos(req: Request) {
    const files = await uploadVideos(req)

    const result: Media[] = await Promise.all(
      files.map((file) => {
        const { newFilename } = file
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video/${newFilename}`
            : `http://localhost:${process.env.PORT}/static/video/${newFilename}`,
          type: MediaType.Video
        }
      })
    )

    return result
  }
}

const mediasServices = new MediasServices()
export default mediasServices
