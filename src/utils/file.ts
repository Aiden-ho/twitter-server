import fs from 'fs'
import formidable, { File, Part } from 'formidable'
import { Request } from 'express'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import { USER_MESSAGES } from '~/constants/messages'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true //cho phép tạo nested folder
      })
    }
  })
}

export const uploadImages = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    keepExtensions: true,
    maxFiles: 4,
    maxFileSize: 300 * 1024, //300kb,
    maxTotalFileSize: 300 * 1024 * 4,
    filter: ({ name, originalFilename, mimetype }: Part) => {
      //Field name bắt buộc phải là image và có mimetype là các loại hình image/
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))

      if (!valid) {
        form.emit('error' as any, new Error(USER_MESSAGES.FILE_TYPE_IS_INVALID) as any)
      }

      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        reject(new Error(USER_MESSAGES.FILE_IS_EMPTY))
      }

      resolve(files.image as File[])
    })
  })
}

export const uploadVideos = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_TEMP_DIR,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, //50MB,
    filter: ({ name, originalFilename, mimetype }: Part) => {
      //Field name bắt buộc phải là video và có mimetype là các loại hình video/
      const valid = name === 'video' && (Boolean(mimetype?.includes('mp4')) || Boolean(mimetype?.includes('quicktime')))

      if (!valid) {
        form.emit('error' as any, new Error(USER_MESSAGES.FILE_TYPE_IS_INVALID) as any)
      }

      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        reject(new Error(USER_MESSAGES.FILE_IS_EMPTY))
      }

      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtensionFormFileName(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
      })

      resolve(videos)
    })
  })
}

export const getNameFormFileName = (fullname: string) => {
  const name_arr = fullname.split('.')
  return name_arr.shift()
}

export const getExtensionFormFileName = (fullname: string) => {
  const name_arr = fullname.split('.')
  return name_arr.pop()
}
