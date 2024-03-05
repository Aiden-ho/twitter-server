import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import 'dotenv/config'
import usersRouter from '~/routes/users.routes'
import databaseServices from './services/database.services'
import { ErrorDefaultHandler } from './middlewares/errors.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import staticRouter from './routes/statics.routes'
import tweetsRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmarks.routes'
import likesRouter from './routes/likes.routes'
import searchRouter from './routes/search.routes'
import conversationServices from './services/conversations.services'
import { ObjectId } from 'mongodb'
import conversationsRouter from './routes/conversations.routes'
import { SocketMessagePayload } from './models/Others'

//import fake data
// import './utils/fake'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL
  }
})

const users: {
  [key: string]: {
    socket_id: string
  }
} = {}

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`)

  const user_id = socket.handshake.auth._id

  users[user_id] = {
    socket_id: socket.id
  }

  console.log(users)

  socket.on('send_message', async ({ payload }: { payload: SocketMessagePayload }) => {
    const { content, receiver_id, sender_id } = payload
    const receirver_socket_id = users[receiver_id].socket_id

    if (!receirver_socket_id) {
      return
    }

    const conversation = await conversationServices.save({
      sender_id: new ObjectId(sender_id),
      receiver_id: new ObjectId(receiver_id),
      content: content
    })

    socket.to(receirver_socket_id).emit('receive_message', { payload: conversation })
  })

  socket.on('disconnect', () => {
    delete users[user_id]
    console.log(`${socket.id} is disconnected`)
  })
})

const port = process.env.PORT || '4000'

//build-in parse json based on body-parse
app.use(express.json())

//database connection
databaseServices.connect().then(() => {
  //Tạo index sau khi connect
  databaseServices.indexUser()
  databaseServices.indexRefreshToken()
  databaseServices.indexVideosStatus()
  databaseServices.indexFollowers()
  databaseServices.indexTweets()
  databaseServices.indexHashTags()
})

//CORS
app.use(cors())

//create folder
initFolder()

//handle routing users
app.use('/users', usersRouter)

//handle routing medias
app.use('/medias', mediasRouter)

// handle routing serve static file
app.use('/static', staticRouter)

// handle routing tweet
app.use('/tweets', tweetsRouter)

// handle routing search
app.use('/search', searchRouter)

// handle routing bookmark tweet
app.use('/bookmarks', bookmarksRouter)

// handle routing like tweet
app.use('/likes', likesRouter)

// handle routing conversation
app.use('/conversations', conversationsRouter)

//default error handler for app
app.use(ErrorDefaultHandler)

httpServer.listen(port, () => {
  console.log(`server is listening on ${port}`)
})
