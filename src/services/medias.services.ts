import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { rimrafSync } from 'rimraf'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getFilesInDir, getNameFormFileName, uploadImages, uploadVideos } from '~/utils/file'
import fs from 'fs'
import fsPromise from 'fs/promises'
import { envConfig, isProduction } from '~/constants/config'
import { MediaType, VideoEncodingStatus } from '~/constants/enum'
import { Media } from '~/models/Others'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import videosStatusServices from './videosStatus.services'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'
import { USER_MESSAGES } from '~/constants/messages'

class Queue {
  items: string[]
  encoding: boolean

  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.items.push(item)
    //item = home\123\12312\123123.mp4
    const slash = (await import('slash')).default
    item = slash(item)
    const videoName = getNameFormFileName(item.split('/').pop() as string) as string
    await videosStatusServices.save({ name: videoName, status: VideoEncodingStatus.Pending })
    this.processEncode()
  }

  async processEncode() {
    if (this.encoding) return

    if (this.items.length > 0) {
      const slash = (await import('slash')).default
      this.encoding = true

      const videoPath = slash(this.items[0])
      const fullVideoName = videoPath.split('/').pop()
      const videoName = getNameFormFileName(fullVideoName as string) as string
      //update trạng thái đang xử lý
      await videosStatusServices.update({ name: videoName, status: VideoEncodingStatus.Processing })
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        //get path của tất cả file HLS
        const files = getFilesInDir(path.resolve(UPLOAD_VIDEO_DIR, videoName))

        await Promise.all(
          files.map((filePath) => {
            //file path in uploads folder
            const filePathInSrc = slash(filePath.replace(path.resolve(UPLOAD_VIDEO_DIR), ''))
            const fullFileName = filePath.split('/').pop()
            //Nếu file là video gốc thì không cần up lên
            if (fullFileName === fullVideoName) return

            return uploadFileToS3({
              fileName: 'videos-hls' + filePathInSrc,
              filePath,
              contentType: mime.getType(filePath) as string
            })
          })
        )

        //Xong thì xóa video đầu đi để những thằng khác dồn lên
        this.items.shift()
        //sau khi encode xong thì xóa luôn folder chứa video gốc và hls trong source
        rimrafSync(path.resolve(UPLOAD_VIDEO_DIR, videoName))
        //Update lại trạng thái thành công
        await videosStatusServices.update({ name: videoName, status: VideoEncodingStatus.Succeed })
        //log
        console.log('Encode video successful')
      } catch (error) {
        console.error(`Encode video ${videoPath} failed`)
        console.error(error)
        //Lỗi thì xóa ra khỏi queue để xử lý thằng khác
        this.items.shift()
        //Update lại trạng thái thấy bại
        await videosStatusServices
          .update({
            name: videoName,
            status: VideoEncodingStatus.Failed,
            message: USER_MESSAGES.UPLOAD_VIDEO_FAILED
          })
          .catch((update_err) => {
            console.error('Update status failed', update_err)
          })
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('No video to encode')
    }
  }
}

const queue = new Queue()

class MediasServices {
  async handlerUploadImages(req: Request) {
    const files = await uploadImages(req)
    // xóa cache để không giữ file thì mới unlink được
    sharp.cache(false)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFormFileName(file.newFilename)
        const newFullName = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullName)

        //clear image metadata by sharp
        await sharp(file.filepath).jpeg().toFile(newPath)

        //Upload image to S3
        await uploadFileToS3({
          fileName: 'images/' + newFullName,
          filePath: newPath,
          contentType: mime.getType(newPath) as string
        })

        //Clear file in source
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])

        //use BE system to serve file
        return {
          url: isProduction
            ? `${envConfig.host}/static/image/${newFullName}`
            : `http://localhost:${envConfig.port}/static/image/${newFullName}`,
          type: MediaType.Image
        }
      })
    )

    return result
  }

  async handlerUploadVideos(req: Request) {
    const files = await uploadVideos(req)

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const { newFilename, filepath, mimetype } = file

        //upload video to S3
        /*
        await uploadFileToS3({
          fileName: 'videos/' + newFilename,
          filePath: filepath,
          contentType: mimetype as string
        })
        */

        //xóa file gốc.
        // Nếu dùng S3 cho video thì nhớ mở cái này ra, nếu dùng source thì comment
        // await rimrafSync(filepath)

        return {
          url: isProduction
            ? `${envConfig.host}/static/video-streaming/${newFilename}`
            : `http://localhost:${envConfig.port}/static/video-streaming/${newFilename}`,
          type: MediaType.Video
        }
      })
    )

    return result
  }

  async handlerUploadVideosHLS(req: Request) {
    const files = await uploadVideos(req)

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const { newFilename, filepath } = file
        const newName = getNameFormFileName(newFilename)
        //thêm video vào queue để chờ encode
        queue.enqueue(filepath)
        return {
          url: isProduction
            ? `${envConfig.host}/static/video/${newName}/master.m3u8`
            : `http://localhost:${envConfig.port}/static/video-hls/${newName}/master.m3u8`,
          type: MediaType.HLS
        }
      })
    )

    return result
  }
}

const mediasServices = new MediasServices()
export default mediasServices
