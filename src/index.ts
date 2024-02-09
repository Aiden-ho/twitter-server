import express, { Request, Response, NextFunction } from 'express'
import 'dotenv/config'
import usersRouter from '~/routes/users.routes'
import databaseServices from './services/database.services'
import { ErrorDefaultHandler } from './middlewares/errors.middlewares'

const app = express()
const port = '4000'

//build-in parse json based on body-parse
app.use(express.json())

//database connection
databaseServices.connect()

//handle routing users
app.use('/users', usersRouter)

//default error handler for app
app.use(ErrorDefaultHandler)

app.listen(port, () => {
  console.log(`server is listening on ${port}`)
})
