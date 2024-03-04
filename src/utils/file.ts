import fs from 'fs'
import formidable, { File, Part } from 'formidable'
import { Request } from 'express'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import { USER_MESSAGES } from '~/constants/messages'
import path from 'path'

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
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error(USER_MESSAGES.FILE_IS_EMPTY))
      }

      resolve(files.image as File[])
    })
  })
}

export const uploadVideos = async (req: Request) => {
  const nanoId = (await import('nanoid')).nanoid
  const idName = nanoId()
  //Mỗi video có 1 thư mục riêng theo tên của video đó
  fs.mkdirSync(path.resolve(UPLOAD_VIDEO_DIR, idName))
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_VIDEO_DIR, idName),
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, //50MB,
    filter: ({ name, originalFilename, mimetype }: Part) => {
      //Field name bắt buộc phải là video và có mimetype là các loại hình video/
      const valid = name === 'video' && (Boolean(mimetype?.includes('mp4')) || Boolean(mimetype?.includes('quicktime')))

      if (!valid) {
        form.emit('error' as any, new Error(USER_MESSAGES.FILE_TYPE_IS_INVALID) as any)
      }

      return valid
    },
    filename: () => idName
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error(USER_MESSAGES.FILE_IS_EMPTY))
      }

      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtensionFormFileName(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
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

export const getFilesInDir = (dir: string, files: string[] = []) => {
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const fileList = fs.readdirSync(dir)
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  for (const file of fileList) {
    const name = `${dir}/${file}`
    // Check if the current file/directory is a directory using fs.statSync
    if (fs.statSync(name).isDirectory()) {
      // If it is a directory, recursively call the getFiles function with the directory path and the files array
      getFilesInDir(name, files)
    } else {
      // If it is a file, push the full path to the files array
      files.push(name)
    }
  }
  return files
}
