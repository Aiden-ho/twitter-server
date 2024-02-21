import { Router } from 'express'
import {
  changePasswordController,
  followUserController,
  forgotPasswordController,
  getMeController,
  getUserController,
  loginController,
  loginOauthController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unFollowUserController,
  updateMeController,
  verifyEmailController,
  verifyForgotpasswordController
} from '~/controllers/user.controller'
import { filterMiddleware } from '~/middlewares/comon.middlewares'
import {
  loginValidator,
  accessTokenValidator,
  registerValidator,
  refreshTokenValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  verifyForgotPasswordValidator,
  resetPasswordValidator,
  verifyUserValidator,
  updateMeValidator,
  followerValidator,
  unfollowerValidator,
  changePasswordValidator
} from '~/middlewares/users.middlewares'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  LoginReqBody,
  LogoutReqBody,
  RegsiterReqBody,
  ResetPasswordReqBody,
  UpdateUserReqBody,
  VerifyEmailReqBody,
  VerifyForgotPasswordReqBody
} from '~/models/requests/User.request'
import { wrapperRequestHandler } from '~/utils/handlers'
const usersRouter = Router()

/**
 * Register new user
 *
 * Path: /register
 * Method: POST
 * body: {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 **/
usersRouter.post(
  '/register',
  registerValidator,
  filterMiddleware<RegsiterReqBody>(['confirm_password', 'date_of_birth', 'email', 'name', 'password']),
  wrapperRequestHandler(registerController)
)

/**
 * Login a user
 *
 * Path: /login
 * Method: POST
 * body: {email: string, password: string}
 **/
usersRouter.post(
  '/login',
  loginValidator,
  filterMiddleware<LoginReqBody>(['email', 'password']),
  wrapperRequestHandler(loginController)
)

/**
 * Login a user with Google Oauth 2.0
 *
 * Path: /oauth/google
 * Method: get
 * query: {code: string, scope: string...}
 **/
usersRouter.get('/oauth/google', wrapperRequestHandler(loginOauthController))

/**
 * Logout a user
 *
 * Path: /logout
 * Method: POST
 * header: bearer access_token
 * body: {refesh_token: string}
 **/
usersRouter.post(
  '/logout',
  accessTokenValidator,
  refreshTokenValidator,
  filterMiddleware<LogoutReqBody>(['refresh_token']),
  wrapperRequestHandler(logoutController)
)

/**
 * Refresh Token
 *
 * Path: /refresh-token
 * Method: POST
 * body: {refesh_token: string}
 **/
usersRouter.post('/refresh-token', refreshTokenValidator, wrapperRequestHandler(refreshTokenController))

/**
 * Verify email user
 *
 * Path: /verify-email
 * Method: POST
 * body: {email_verify_token: string}
 **/
usersRouter.post(
  '/verify-email',
  verifyEmailValidator,
  filterMiddleware<VerifyEmailReqBody>(['email_verify_token']),
  wrapperRequestHandler(verifyEmailController)
)

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
  filterMiddleware<VerifyForgotPasswordReqBody>(['forgot_password_token']),
  wrapperRequestHandler(verifyForgotpasswordController)
)

/**
 * reset password
 *
 * Path: /reset-password
 * Method: POST
 * body: {forgot-password-token: string, password: string, confirm-passowrd: string}
 **/
usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  filterMiddleware<ResetPasswordReqBody>(['confirm_password', 'forgot_password_token', 'password']),
  wrapperRequestHandler(resetPasswordController)
)

/**
 * get profile me
 *
 * Path: /me
 * Method: GET
 * header: bearer access_token
 **/
usersRouter.get('/me', accessTokenValidator, wrapperRequestHandler(getMeController))

/**
 * update profile me
 *
 * Path: /me
 * Method: PATCH
 * header: bearer access_token
 * body: user schema
 **/
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifyUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateUserReqBody>([
    'name',
    'date_of_birth',
    'avatar',
    'bio',
    'cover_photo',
    'website',
    'location',
    'username'
  ]),
  wrapperRequestHandler(updateMeController)
)

/**
 * get profile user
 *
 * Path: /:user_name
 * Method: GET
 **/
usersRouter.get('/:user_name', wrapperRequestHandler(getUserController))

/**
 * follow user
 *
 * Path: /follow
 * Method: POST
 * header: bearer access_token
 * body: {followed_user_id: string}
 **/
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifyUserValidator,
  followerValidator,
  filterMiddleware<FollowReqBody>(['followed_user_id']),
  wrapperRequestHandler(followUserController)
)

/**
 * unfollow user
 *
 * Path: /follow/:user_id
 * Method: DELETE
 * header: bearer access_token
 **/
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifyUserValidator,
  unfollowerValidator,
  wrapperRequestHandler(unFollowUserController)
)

/**
 * Change password user
 *
 * Path: /change-password
 * Method: PUT
 * header: bearer access_token
 * body: {old_password: string, new_password: string, confirm_new_password: string}
 **/
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifyUserValidator,
  changePasswordValidator,
  filterMiddleware<ChangePasswordReqBody>(['confirm_new_password', 'new_password', 'old_password']),
  wrapperRequestHandler(changePasswordController)
)

export default usersRouter
