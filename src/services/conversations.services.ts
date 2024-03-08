import { ObjectId } from 'mongodb'
import databaseServices from './database.services'
import Conversation from '~/models/schemas/Conversation.schema'

class ConversationServices {
  async save({ sender_id, receiver_id, content }: { sender_id: ObjectId; receiver_id: ObjectId; content: string }) {
    const conversation = new Conversation({ sender_id, receiver_id, content })
    const result = await databaseServices.conversations.insertOne(conversation)
    conversation._id = result.insertedId

    return conversation
  }

  async getConversations({
    sender_id,
    receiver_id,
    limit,
    page
  }: {
    sender_id: string
    receiver_id: string
    limit: number
    page: number
  }) {
    const match = {
      $or: [
        { sender_id: new ObjectId(sender_id), receiver_id: new ObjectId(receiver_id) },
        { sender_id: new ObjectId(receiver_id), receiver_id: new ObjectId(sender_id) }
      ]
    }
    const conversations = await databaseServices.conversations
      .find(match)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const total = await databaseServices.conversations.countDocuments(match)

    return { conversations, total }
  }
}

const conversationServices = new ConversationServices()
export default conversationServices
