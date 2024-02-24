import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import isEmpty from 'lodash/isEmpty'
import { TweetType, TweetAudience, MediaType } from '~/constants/enum'
import { TWEET_MESSAGES } from '~/constants/messages'
import { convertNumberEnumToArray } from '~/utils/common'
import validationRunner from '~/utils/validation-runner'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import tweetServices from '~/services/tweets.services'

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
              ![TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
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
            console.log(tweet)
            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEET_MESSAGES.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)
