import { Request, Response } from 'express'
import fs from 'fs'
import mime from 'mime'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import {
  ServeImageReqParams,
  ServeM3u8ReqParams,
  ServeSegmentReqParams,
  ServeVideoReqParams
} from '~/models/requests/Media.request'
import { getNameFormFileName } from '~/utils/file'
import { sendFilefromS3 } from '~/utils/s3'

export const serveImageController = (req: Request<ServeImageReqParams>, res: Response) => {
  const { filename } = req.params

  sendFilefromS3(res, `images/${filename}`)

  // return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, filename), (error) => {
  //   if (error) {
  //     res.status((error as any).status).send(USER_MESSAGES.NOT_FOUND)
  //   }
  // })
}

export const serveVideoStreamingController = async (req: Request<ServeVideoReqParams>, res: Response) => {
  const range = req.headers.range

  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range Headers')
  }

  const { filename } = req.params
  const id = getNameFormFileName(filename) as string
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, id, filename)

  //1Mb = 10^6 bytes (theo hệ thập phân, format ta thường thấy hiển thị trên UI, ví dụ như progress...)
  // Nếu theo hệ nhi phân thì 1Mb =  2 ^ 20 (1024 * 1024)

  //Lấy dung lượng của file(bytes)
  const videoSize = fs.statSync(videoPath).size

  //Dung lượng của mỗi phân đoạn stream (1MB), có thể cấu hình
  const chunkSize = 10 ** 6 // 10^6

  // Lấy giá trị bytes bắt đầu trong header range  (bytes=5079040-) bằng cách xóa tất cả non-digi trong range bằng replace
  const start = Number(range?.replace(/\D/g, ''))

  //Lấy giá trị bytes kết thúc.
  // Nếu start + chunkSize mà nhỏ hơn videoSize => Video còn nhiều , thì lấy total này
  // Nếu start + chunksize mà lớn hơn videoSize => gần hết video, thì lấy video size
  const end = Math.min(start + chunkSize, videoSize - 1)

  //Dung lượng thực tế của mỗi đoạn stream
  //contentSize thông thường sẽ bằng chunkSize nhưng khi rơi vào đường hợp gần hết video thì lại không bằng nữa
  // Nến cần tạo contentSize để lấy được giá trị thực tế
  const contentLength = end - start + 1

  /**
   * Format của header Content-Range: bytes <start>-<end>/<videoSize>
   * Ví dụ: Content-Range: bytes 1048576-3145727/3145728
   * Yêu cầu là `end` phải luôn luôn nhỏ hơn `videoSize`
   * ❌ 'Content-Range': 'bytes 0-100/100'
   * ✅ 'Content-Range': 'bytes 0-99/100'
   *
   * Còn Content-Length sẽ là end - start + 1. Đại diện cho khoản cách.
   * Để dễ hình dung, mọi người tưởng tượng từ số 0 đến số 10 thì ta có 11 số.
   * byte cũng tương tự, nếu start = 0, end = 10 thì ta có 11 byte.
   * Công thức là end - start + 1
   *
   * ChunkSize = 50
   * videoSize = 100
   * |0----------------50|51----------------99|100 (end)
   * stream 1: start = 0, end = 50, contentLength = 51
   * stream 2: start = 51, end = 99, contentLength = 49
   */

  const contentType = mime.getType(videoPath) || 'video/mp4'
  const headers = {
    'Content-Length': contentLength,
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Content-Type': contentType
  }

  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)

  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}

export const serveVideoStreamingFromS3Controller = async (req: Request<ServeVideoReqParams>, res: Response) => {
  const { filename } = req.params
  // const id = getNameFormFileName(filename) as string

  sendFilefromS3(res, `videos/${filename}`)
}

export const serveM3u8Controller = (req: Request<ServeM3u8ReqParams>, res: Response) => {
  const id = req.params.id
  sendFilefromS3(res, `videos-hls/${id}/master.m3u8`)

  //Serve file M3u8 trong source
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (error) => {
  //   if (error) {
  //     res.status((error as any).status).send(USER_MESSAGES.NOT_FOUND)
  //   }
  // })
}

export const serveSegmentController = (req: Request<ServeSegmentReqParams>, res: Response) => {
  const { id, v, segment } = req.params
  sendFilefromS3(res, `videos-hls/${id}/${v}/${segment}`)

  //Serve file segment trong source
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (error) => {
  //   if (error) {
  //     res.status((error as any).status).send(USER_MESSAGES.NOT_FOUND)
  //   }
  // })
}
