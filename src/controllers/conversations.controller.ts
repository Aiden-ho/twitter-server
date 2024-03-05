import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { CONVERSATION_MESSAGES } from '~/constants/messages'
import { getConversationsReqParams, getConversationsReqQuery } from '~/models/requests/Conversation.request'
import { PayloadToken } from '~/models/requests/User.request'
import conversationServices from '~/services/conversations.services'
import databaseServices from '~/services/database.services'

export const getConversationsController = async (
  req: Request<getConversationsReqParams, any, any, getConversationsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as PayloadToken
  const receiver_id = req.params.receiver_id
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const { conversations, total } = await conversationServices.getConversations({
    sender_id: user_id,
    receiver_id,
    limit,
    page
  })

  return res.json({
    message: CONVERSATION_MESSAGES.GET_CONVERSATIONS_SUCCESSFUL,
    result: {
      conversations,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}
