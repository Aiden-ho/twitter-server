import { Router } from 'express'
import {
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  verifyEmailController,
  verifyForgotpasswordController
} from '~/controllers/user.controller'
import {
  loginValidator,
  accessTokenValidator,
  registerValidator,
  refreshTokenValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  verifyForgotPasswordValidator,
  resetPasswordValidator
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

/**
 * Verify email user
 *
 * Path: /verify-email
 * Method: POST
 * body: {email_verify_token: string}
 **/
usersRouter.post('/verify-email', verifyEmailValidator, wrapperRequestHandler(verifyEmailController))

/**
 * Resend verify email user
 *
 * Path: /resend-verify-email
 * Method: POST
 * header: bearer access_token
 **/
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapperRequestHandler(resendVerifyEmailController))

/**
 * user forgot password
 *
 * Path: /forgot-password
 * Method: POST
 * header: bearer access_token
 **/
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapperRequestHandler(forgotPasswordController))

/**
 * verify request forgot password
 *
 * Path: /verify-forgot-password
 * Method: POST
 * body: {forgot-password-token: string}
 **/
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapperRequestHandler(verifyForgotpasswordController)
)

/**
 * reset password
 *
 * Path: /reset-password
 * Method: POST
 * body: {forgot-password-token: string, password: string, confirm-passowrd: string}
 **/
usersRouter.post('/reset-password', resetPasswordValidator, wrapperRequestHandler(resetPasswordController))

export default usersRouter
