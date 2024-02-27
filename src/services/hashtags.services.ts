import Hashtag from '~/models/schemas/Hashtag.schema'
import databaseServices from './database.services'
import { ObjectId, WithId } from 'mongodb'
import Tweet from '~/models/schemas/Tweet.schema'

class HashtagServices {
  //Kiểm tra xem hastag có chưa , nếu chưa thì tạo mới
  save(hashtag: string) {
    return databaseServices.hashtags.findOneAndUpdate(
      {
        name: hashtag
      },
      {
        $setOnInsert: new Hashtag({ name: hashtag })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
  }

  async checkAndCreate(hashtags: string[]) {
    const hashtagsDocuments = await Promise.all(
      hashtags.map((item) => {
        return this.save(item)
      })
    )

    return hashtagsDocuments.map((hashtag) => (hashtag as WithId<Hashtag>)._id)
  }
}

const hashtagServices = new HashtagServices()
export default hashtagServices
