import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/user.controller'
import {
  loginValidator,
  accessTokenValidator,
  registerValidator,
  refreshTokenValidator
} from '~/middlewares/users.middlewares'
import { wrapperRequestHandler } from '~/utils/handlers'
const usersRouter = Router()

/**
 * Register new user
 *
 * Path: /register
 * Method: POST
 * body: {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 **/
usersRouter.post('/register', registerValidator, wrapperRequestHandler(registerController))

/**
 * Login a user
 *
 * Path: /login
 * Method: POST
 * body: {email: string, password: string}
 **/
usersRouter.post('/login', loginValidator, wrapperRequestHandler(loginController))

/**
 * Logout a user
 *
 * Path: /logout
 * Method: POST
 * header: bearer access_token
 * body: {refesh_token: string}
 **/
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapperRequestHandler(logoutController))

export default usersRouter
