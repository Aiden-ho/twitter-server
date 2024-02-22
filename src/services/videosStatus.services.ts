import { VideoEncodingStatus } from '~/constants/enum'
import databaseServices from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schema'

class VideosStatusServices {
  async save({ name, status }: { name: string; status: VideoEncodingStatus }) {
    await databaseServices.videosStatus.insertOne(new VideoStatus({ name, status }))
  }
  async update({ name, status, message = '' }: { name: string; status: VideoEncodingStatus; message?: string }) {
    await databaseServices.videosStatus.updateOne(
      { name },
      {
        $set: { status, message },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }
  async get(idName: string) {
    const result = await databaseServices.videosStatus.findOne({ name: idName })
    return result
  }
}

const videosStatusServices = new VideosStatusServices()
export default videosStatusServices
