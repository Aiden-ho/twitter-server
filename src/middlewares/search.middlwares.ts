import validationRunner from '~/utils/validation-runner'
import { checkSchema } from 'express-validator'
import { MediaTypeQuery, PeopleFollowedQuery } from '~/constants/enum'
import { covertStringEnumToArray } from '~/utils/common'
import { TWEET_MESSAGES } from '~/constants/messages'

const arrayMediaTypeQuery = covertStringEnumToArray(MediaTypeQuery)
const arrayPeopleFollowedQuery = covertStringEnumToArray(PeopleFollowedQuery)

export const searchTextValidator = validationRunner(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: TWEET_MESSAGES.CONTENT_MUST_BE_A_EMPTY_STRING
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [arrayMediaTypeQuery],
          errorMessage: TWEET_MESSAGES.MEDIA_TYPE_MUST_BE_IMAGE_OR_VIDEO
        }
      },
      people_followed: {
        optional: true,
        isIn: {
          options: [arrayPeopleFollowedQuery],
          errorMessage: TWEET_MESSAGES.PEOPLE_FOLLOWED_MUST_BE_0_OR_1
        }
      }
    },
    ['query']
  )
)

export const searchHashTagValidator = validationRunner(
  checkSchema(
    {
      hashtag: {
        isString: {
          errorMessage: TWEET_MESSAGES.HASHTAG_MUST_BE_A_STRING
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [arrayMediaTypeQuery],
          errorMessage: TWEET_MESSAGES.MEDIA_TYPE_MUST_BE_IMAGE_OR_VIDEO
        }
      },
      people_followed: {
        optional: true,
        isIn: {
          options: [arrayPeopleFollowedQuery],
          errorMessage: TWEET_MESSAGES.PEOPLE_FOLLOWED_MUST_BE_0_OR_1
        }
      }
    },
    ['query', 'params']
  )
)
