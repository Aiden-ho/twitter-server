import { ObjectId } from 'mongodb'
import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import conversationServices from '~/services/conversations.services'
import { SocketMessagePayload } from '~/models/Others'
import { verifyAccessToken } from '~/utils/common'
import { PayloadToken } from '~/models/requests/User.request'
import { UserVerifyStatus } from '~/constants/enum'
import { ErrorWithStatus } from '~/models/Errors'
import { USER_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'

function initSocket(httpServer: HttpServer) {
  // Tạo IO server
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL
    }
  })

  //danh sách những user đang kết nối socket
  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}

  //Server middleware
  io.use(async (socket, next) => {
    try {
      // Kiểm tra access_token
      const { Authorization } = socket.handshake.auth
      const decoded_authorization = (await verifyAccessToken(Authorization)) as PayloadToken
      if (decoded_authorization.verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDEN
        })
      }
      //Add vào handshake , tương tự cách add vào req
      socket.handshake.auth.decoded_authorization = decoded_authorization
      socket.handshake.auth.access_token = Authorization
      next()
    } catch (error) {
      //Error Cần truyền đúng kiểu dữ liệu
      next({
        message: 'Unauthorized',
        name: 'unauthorizedError',
        data: error
      })
    }
  })

  //handle connecttion
  io.on('connection', (socket) => {
    //Lấy thông tin thêm vào từ middlware server
    const { user_id } = socket.handshake.auth.decoded_authorization as PayloadToken
    const access_token = socket.handshake.auth.access_token

    console.log(`${socket.id} connected`)

    //thêm vào danh sách user đang kết nối
    users[user_id] = {
      socket_id: socket.id
    }

    //socket middleware
    socket.use(async ([event, ...args], next) => {
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })

    //Handle lỗi, nếu socket middware nào next(error) thì sẽ nhảy vào đây
    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    //handle send_message
    socket.on('send_message', async ({ payload }: { payload: SocketMessagePayload }) => {
      const { content, receiver_id, sender_id } = payload

      if (!users[receiver_id]) {
        return
      }

      const receirver_socket_id = users[receiver_id].socket_id
      if (!receirver_socket_id) {
        return
      }

      //lưu message vào db
      const conversation = await conversationServices.save({
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        content: content
      })

      socket.to(receirver_socket_id).emit('receive_message', { payload: conversation })
    })

    //handle disconnect
    socket.on('disconnect', () => {
      //Xóa khỏi danh sách kết nối
      delete users[user_id]
      console.log(`${socket.id} is disconnected`)
    })
  })
}

export default initSocket
