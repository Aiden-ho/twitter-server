import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'
import { parse } from 'yaml'
import { createServer } from 'http'
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
import conversationsRouter from './routes/conversations.routes'
import initSocket from './utils/socket'
import { envConfig, isProduction } from './constants/config'

//import fake data
// import './utils/fake'

const app = express()
const httpServer = createServer(app)

initSocket(httpServer)
const port = envConfig.port

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
  databaseServices.indexConversation()
})

//Helmet
app.use(helmet())

//CORS
app.use(
  cors({
    origin: isProduction ? envConfig.host : '*'
  })
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
})

// Apply the rate limiting middleware to all requests.
app.use(limiter)

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

const file = readFileSync('./twitter-swagger.yaml', 'utf8')
const swaggerDocument = parse(file)

// const option: SwaggerUiOptions = {
//   customJs:
// }

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

//default error handler for app
app.use(ErrorDefaultHandler)

httpServer.listen(port, () => {
  console.log(`server is listening on ${port}`)
})
