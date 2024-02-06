export const USER_MESSAGES = {
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_ALREADY_EXISTS: 'Email is already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be from 6 to 50',
  PASSWORD_MUST_BE_STRONG:
    'Password must be at least 6 characters long and contrain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_IS_NOT_MATCH: 'Confirm password is not match',
  DATE_OF_BIRTH_MUST_BE_A_ISO861: 'Date of birth must be a ISO861',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password is incorrect',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is requried',
  ACCESS_TOKEN_IS_INVALID: 'Access token is invalid',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is requried',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
  USED_REFRESH_TOKEN_OR_NOT_EXISTS: 'Used refresh token or not exists',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is requried',
  EMAIL_VERIFY_TOKEN_IS_INVALID: 'Email verify is invalid',
  EMAIL_IS_VERIFIED: 'Email is verified',
  RESEND_EMAIL_VERIFY_SUCCESS: 'Resend email verify successful',
  USER_NOT_FOUND: 'User not found',
  EMAIL_VERIFY_SUCCESSFUL: 'Email verify successful',
  LOGIN_SUCCESSFUL: 'Login successful',
  LOGOUT_SUCCESSFULL: 'Logout successful',
  REGISTER_SUCCESSFULL: 'Register successful',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is requried',
  FORGOT_PASSWORD_TOKEN_IS_INVALID: 'Forgot password token is invalid',
  FORGOT_PASSWORD_VERIFY_SUCCESSFUL: 'Forgot password verify successful',
  RESET_PASSWORD_SUCCESSFUL: 'Reset password successful',
  GET_PROFILE_SUCCESSFUL: 'Get profile successful',
  TOKEN_IS_EXPIRED: 'Token is expired',
  USER_NOT_VERIFIED: 'User not verified',
  IMAGE_URL_MUST_BE_STRING: 'Image url must be string',
  IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400: 'Image url length must be from 1 to 400',
  BIO_MUST_BE_STRING: 'Bio must be string',
  BIO_LENGTH_MUST_BE_FROM_1_TO_200: 'Bio length must be from 1 to 200',
  LOCATION_MUST_BE_STRING: 'Location must be string',
  LOCATION_LENGTH_MUST_BE_FROM_1_TO_200: 'Location length must be from 1 to 200',
  WEBSITE_MUST_BE_STRING: 'Website must be string',
  WEBSITE_LENGTH_MUST_BE_FROM_1_TO_200: 'Website length must be from 1 to 200',
  USERNAME_MUST_BE_STRING: 'Username must be string',
  USERNAME_IS_INVALID:
    'Username must be 1-50 characters long and contain only letters, numbers, underscores, hyphens, not only numbers',
  USERNAME_IS_ALREADY_EXISTS: 'username is already exists',
  USERNAME_MUST_BE_DIFFERENT_FROM_THE_CURRENT: 'Username must be different from the current',
  UPDATE_ME_SUCCESSFUL: 'Update profile successful',
  GET_ME_SUCCESSFUL: 'Get me successful',
  USER_ID_IS_INVALID: 'User id is invalid',
  ALREADY_FOLLOWED: 'Already followed',
  ALREADY_UNFOLLOWED: 'Already unfollowed',
  FOLLOW_SUCCESSFUL: 'Follow successful',
  UNFOLLOW_SUCCESSFUL: 'Unfollow successful'
} as const
