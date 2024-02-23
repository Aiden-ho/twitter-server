import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import usersRouter from '~/routes/users.routes'
import databaseServices from './services/database.services'
import { ErrorDefaultHandler } from './middlewares/errors.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import staticRouter from './routes/statics.route'

const app = express()
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

//default error handler for app
app.use(ErrorDefaultHandler)

app.listen(port, () => {
  console.log(`server is listening on ${port}`)
})
