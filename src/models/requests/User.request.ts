import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enum'

export interface RegsiterReqBody {
  email: string
  password: string
  confirm_password: string
  name: string
  date_of_birth: string
}

export interface LogoutReqBody {
  refresh_token: string
}

export interface PayloadToken extends JwtPayload {
  user_id: string
  token_type: TokenType
}

export interface VerifyEmailReqBody {
  email_verify_token: string
}
