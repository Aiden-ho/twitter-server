import { Router } from 'express'
import { getConversationsController } from '~/controllers/conversations.controller'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, receiverIdValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapperRequestHandler } from '~/utils/handlers'

const conversationsRouter = Router()

conversationsRouter.get(
  '/receiver/:receiver_id',
  paginationValidator,
  accessTokenValidator,
  verifyUserValidator,
  receiverIdValidator,
  wrapperRequestHandler(getConversationsController)
)

export default conversationsRouter
