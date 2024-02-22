import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { getNameFormFileName, uploadImages, uploadVideos } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { MediaType, VideoEncodingStatus } from '~/constants/enum'
import { Media } from '~/models/Others'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import videosStatusServices from './videosStatus.services'

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
    const videoName = getNameFormFileName(item.split(/\\/g).pop() as string) as string
    await videosStatusServices.save({ name: videoName, status: VideoEncodingStatus.Pending })
    this.processEncode()
  }

  async processEncode() {
    if (this.encoding) return

    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      const videoName = getNameFormFileName(videoPath.split('/').pop() as string) as string
      //update trạng thái đang xử lý
      await videosStatusServices.update({ name: videoName, status: VideoEncodingStatus.Processing })
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        //Xong thì xóa video đầu đi để những thằng khác dồn lên
        this.items.shift()
        //sau khi encode xong thì xóa luôn video gốc
        fs.unlinkSync(videoPath)
        //Update lại trạng thái thành công
        await videosStatusServices.update({ name: videoName, status: VideoEncodingStatus.Succeed })
        //log
        console.log('Encode video successful')
      } catch (error) {
        console.error(`Encode video ${videoPath} failed`)
        console.error(error)
        //Update lại trạng thái thấy bại
        await videosStatusServices
          .update({
            name: videoName,
            status: VideoEncodingStatus.Failed,
            message: JSON.stringify(error)
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
            ? `${process.env.HOST}/static/video/${newName}/master.m3u8`
            : `http://localhost:${process.env.PORT}/static/video-hls/${newName}/master.m3u8`,
          type: MediaType.Video
        }
      })
    )

    return result
  }
}

const mediasServices = new MediasServices()
export default mediasServices
