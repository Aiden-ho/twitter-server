import Hashtag from '~/models/schemas/Hashtag.schema'
import isEmpty from 'lodash/isEmpty'
import databaseServices from './database.services'
import { ObjectId, WithId } from 'mongodb'
import Tweet from '~/models/schemas/Tweet.schema'
import { MediaType, MediaTypeQuery, TweetType, UserVerifyStatus } from '~/constants/enum'
import { NewFeedRes } from '~/models/response/tweet.response'

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

  async searchTweetsByHashtag({
    hashtag,
    user_id,
    limit,
    page,
    media_type,
    people_followed
  }: {
    hashtag: string
    user_id: string
    limit: number
    page: number
    media_type?: MediaTypeQuery
    people_followed?: ObjectId[]
  }) {
    const media_filer: any = {}
    const user_id_filter: any = {}

    //Kiểm tra media_type
    if (media_type) {
      if (media_type === MediaTypeQuery.Image) {
        media_filer['medias.type'] = MediaType.Image
      }
      if (media_type === MediaTypeQuery.Video) {
        media_filer['medias.type'] = {
          $in: [MediaType.Video, MediaType.HLS]
        }
      }
    }

    //Kiểm tra people_followed
    if (people_followed) {
      user_id_filter['user_id'] = {
        $in: people_followed
      }
    }

    const match_agg = [
      {
        $match: {
          $text: {
            $search: hashtag
          }
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: '_id',
          foreignField: 'hashtags',
          as: 'tweets'
        }
      },
      {
        $unwind: {
          path: '$tweets'
        }
      },
      {
        $replaceRoot: {
          newRoot: '$tweets'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          $or: [
            {
              audience: 0
            },
            {
              $and: [
                {
                  audience: 1
                },
                {
                  'user.twitter_circle': {
                    $in: [new ObjectId(user_id)]
                  }
                }
              ]
            },
            {
              $and: [
                {
                  audience: 1
                },
                {
                  user_id: user_id
                }
              ]
            }
          ]
        }
      },
      {
        $match: {
          'user.verify': {
            $ne: UserVerifyStatus.Banned
          },
          //Nếu object khác rỗng thì dùng spread operator để lấy data trong đó và add vào  $match
          ...(!isEmpty(media_filer) && { ...media_filer }),
          ...(!isEmpty(user_id_filter) && { ...user_id_filter })
        }
      }
    ]

    const count_agg = [
      ...match_agg,
      {
        $count: 'total'
      }
    ]

    const handle_tweets_agg = [
      ...match_agg,
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags'
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'bookmarks'
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes'
        }
      },
      {
        $addFields: {
          bookmarks: {
            $size: '$bookmarks'
          },
          likes: {
            $size: '$likes'
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions'
        }
      },
      {
        $addFields: {
          mentions: {
            $map: {
              input: '$mentions',
              as: 'item',
              in: {
                _id: '$$item._id',
                name: '$$item.name',
                username: '$$item.username',
                email: '$$item.email'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'children_tweet'
        }
      },
      {
        $addFields: {
          count_retweet: {
            $size: {
              $filter: {
                input: '$children_tweet',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', TweetType.Retweet]
                }
              }
            }
          },
          count_coment: {
            $size: {
              $filter: {
                input: '$children_tweet',
                as: 'child',
                cond: {
                  $eq: ['$$child.type', TweetType.Comment]
                }
              }
            }
          },
          count_quote: {
            $size: {
              $filter: {
                input: '$children_tweet',
                as: 'child',
                cond: {
                  $eq: ['$$child.type', TweetType.QuoteTweet]
                }
              }
            }
          }
        }
      },

      {
        $project: {
          children_tweet: 0,
          user: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0,
            date_of_birth: 0,
            twitter_circle: 0
          }
        }
      },
      {
        $unwind: {
          path: '$user'
        }
      }
    ]

    const [tweets, count_result] = await Promise.all([
      databaseServices.hashtags.aggregate<NewFeedRes>(handle_tweets_agg).toArray(),
      databaseServices.hashtags.aggregate<{ total: number }>(count_agg).toArray()
    ])

    const total = count_result.length ? count_result[0].total : 0
    return { tweets, total }
  }
}

const hashtagServices = new HashtagServices()
export default hashtagServices
