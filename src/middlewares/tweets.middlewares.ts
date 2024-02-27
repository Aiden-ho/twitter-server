import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import isEmpty from 'lodash/isEmpty'
import { TweetType, TweetAudience, MediaType, UserVerifyStatus } from '~/constants/enum'
import { TWEET_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import { convertNumberEnumToArray } from '~/utils/common'
import validationRunner from '~/utils/validation-runner'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import tweetServices from '~/services/tweets.services'
import { NextFunction, Request, Response } from 'express'
import Tweet from '~/models/schemas/Tweet.schema'
import { wrapperRequestHandler } from '~/utils/handlers'
import databaseServices from '~/services/database.services'

const arrayTweetType = convertNumberEnumToArray(TweetType)
const arrayTweetAudience = convertNumberEnumToArray(TweetAudience)
const arrayMediaType = convertNumberEnumToArray(MediaType)

export const tweetValidator = validationRunner(
  checkSchema(
    {
      type: {
        isIn: {
          options: [arrayTweetType],
          errorMessage: TWEET_MESSAGES.TWEET_TYPE_INVALID
        }
      },
      audience: {
        isIn: {
          options: [arrayTweetAudience],
          errorMessage: TWEET_MESSAGES.TWEET_AUDIENCE_INVALID
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            //Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha
            if (
              [TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
            }

            //Nếu `type` là tweet thì `parent_id` phải là `null`
            if (type === TweetType.Tweet && value !== null) {
              throw Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
            }

            return true
          }
        }
      },
      content: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]

            // Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng.
            if (
              [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
              isEmpty(hashtags) &&
              isEmpty(mentions) &&
              value.trim() === ''
            ) {
              throw Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_VALUE_STRING)
            }

            //Nếu `type` là retweet thì `content` phải là `''`.
            if (type === TweetType.Retweet && value.trim() !== '') {
              throw Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_EMPTY_STRING)
            }

            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Mỗi phần tử phải là string
            if (!value.every((item: any) => typeof item === 'string')) {
              throw new Error(TWEET_MESSAGES.HASHTAG_MUST_BE_A_ARRAY_STRING)
            }

            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Mỗi phần tử phải là user_id
            if (!value.every((item: any) => !ObjectId.isValid(item))) {
              throw new Error(TWEET_MESSAGES.HASHTAG_MUST_BE_A_ARRAY_STRING)
            }

            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Mỗi phần tử phải là Media Object
            if (!value.every((item: any) => typeof item.url === 'string' && arrayMediaType.includes(item.type))) {
              throw new Error(TWEET_MESSAGES.MEDIAS_MUST_BE_A_ARRAY_OF_MEDIA_OBJECT)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const tweetIdValidator = validationRunner(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: TWEET_MESSAGES.TWEET_ID_IS_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const tweet = await tweetServices.get(new ObjectId(value))
            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEET_MESSAGES.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)

//Dùng wrapper vì có async - await
export const tweetAudienceValidator = wrapperRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  // Nếu là tweet private
  if (tweet.audience === TweetAudience.TwitterCircle) {
    //Kiểm tra xem login chưa
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    const { user_id: watcher_id } = req.decoded_authorization
    // const author = await userServices.getFullUser(tweet.user_id.toString())
    const author = await databaseServices.users.findOne({ _id: tweet.user_id })
    // Kiểm tra xem account tác giả còn tồn tại không
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    // Kiểm tra xem user có nằm trong twitter circle của author không
    const isInCircle = author.twitter_circle.some((twitter_item) => twitter_item.equals(watcher_id))
    if (!isInCircle && !author._id.equals(watcher_id)) {
      throw new ErrorWithStatus({
        message: TWEET_MESSAGES.TWEET_IS_NOT_PUBLIC,
        status: HTTP_STATUS.FORBIDEN
      })
    }
  }

  next()
})

export const tweetChildrenValidator = validationRunner(
  checkSchema(
    {
      tweet_type: {
        isNumeric: {
          errorMessage: TWEET_MESSAGES.TWEET_TYPE_MUST_BE_A_NUMBER
        },
        isIn: {
          options: [arrayTweetType],
          errorMessage: TWEET_MESSAGES.TWEET_TYPE_INVALID
        },
        custom: {
          options: (value, { req }) => {
            const num = Number(value)

            if (num === 0) {
              throw new Error(TWEET_MESSAGES.TWEET_TYPE_MUST_BE_DIFFERENT_FROM_TWEET)
            }

            return true
          }
        }
      }
    },
    ['query']
  )
)

export const paginationValidator = validationRunner(
  checkSchema(
    {
      limit: {
        isNumeric: {
          errorMessage: TWEET_MESSAGES.LIMIT_MUST_BE_A_NUMBER
        },
        custom: {
          options: (value, { req }) => {
            const num = Number(value)

            if (num > Number(process.env.MAXIMUM_LIMIT_TWEET) || num < Number(process.env.MINIMUM_LIMIT_TWEET)) {
              throw new Error(TWEET_MESSAGES.LIMIT_VALUE_MUST_BE_FROM_1_TO_100)
            }

            return true
          }
        }
      },
      page: {
        isNumeric: {
          errorMessage: TWEET_MESSAGES.PAGE_MUST_BE_A_NUMBER
        },
        custom: {
          options: (value, { req }) => {
            const num = Number(value)

            if (num < 1) {
              throw new Error(TWEET_MESSAGES.PAGE_VALUE_MUST_BE_AT_LEAST_1)
            }

            return true
          }
        }
      }
    },
    ['query']
  )
)
