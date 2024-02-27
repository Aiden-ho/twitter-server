import { CreateTweetReqBody } from '~/models/requests/Tweet.request'
import databaseServices from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import hashtagServices from './hashtags.services'
import { TweetType, UserVerifyStatus } from '~/constants/enum'
import { NewFeedRes, tweetDetailRes } from '~/models/response/tweet.response'

class TweetServices {
  /**
   * Get thông thường từ DB
   * @param tweet_id - ObjectId
   */
  async get(tweet_id: ObjectId) {
    const result = await databaseServices.tweets.findOne({ _id: tweet_id })
    return result
  }

  async save(user_id: string, body: CreateTweetReqBody) {
    const hashtags = await hashtagServices.checkAndCreate(body.hashtags)
    const result = await databaseServices.tweets.insertOne(
      new Tweet({
        user_id: new ObjectId(user_id),
        type: body.type,
        audience: body.audience,
        content: body.content,
        parent_id: body.parent_id,
        hashtags,
        mentions: body.mentions,
        medias: body.medias
      })
    )

    const tweet = await this.getDetail(result.insertedId)

    return tweet
  }

  /**
   * Get bằng aggregate để trả về client
   * @param tweet_id - ObjectId
   */
  async getDetail(tweet_id: ObjectId) {
    const agg = [
      {
        $match: {
          _id: tweet_id
        }
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
          children_tweet: 0
        }
      }
    ]
    const result = await databaseServices.tweets.aggregate<tweetDetailRes>(agg).toArray()
    return result[0]
  }

  async increaseTweetView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseServices.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          user_views: 1,
          guest_views: 1,
          updated_at: 1
        }
      }
    )

    return result as WithId<Pick<Tweet, 'user_views' | 'guest_views' | 'updated_at'>>
  }

  async getChildrenDetail({
    tweet_id,
    tweet_type,
    limit,
    page
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
  }) {
    const agg = [
      {
        $match: {
          parent_id: new ObjectId(tweet_id),
          type: tweet_type
        }
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
          children_tweet: 0
        }
      },
      {
        $skip: (page - 1) * limit // công thức phân trang
      },
      {
        $limit: limit
      }
    ]

    const tweets = await databaseServices.tweets.aggregate<tweetDetailRes>(agg).toArray()
    const total = await databaseServices.tweets.countDocuments({
      parent_id: new ObjectId(tweet_id),
      type: tweet_type
    })

    return { tweets, total }
  }

  async increaseTweetsView({ ids, updated_at, user_id }: { ids: ObjectId[]; updated_at: Date; user_id?: string }) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }

    return databaseServices.tweets.updateMany(
      {
        _id: { $in: ids }
      },
      {
        $set: {
          updated_at
        },
        $inc: inc
      }
    )
  }

  async getNewFeeds({
    follower_user_ids,
    user_id,
    limit,
    page
  }: {
    follower_user_ids: ObjectId[]
    user_id: string
    limit: number
    page: number
  }) {
    const match_agg = [
      {
        $match: {
          user_id: {
            $in: follower_user_ids
          }
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
          }
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
      databaseServices.tweets.aggregate<NewFeedRes>(handle_tweets_agg).toArray(),
      databaseServices.tweets.aggregate<{ total: number }>(count_agg).toArray()
    ])

    const total = count_result[0].total
    return { tweets, total }
  }
}

const tweetServices = new TweetServices()
export default tweetServices
