import { createHmac } from 'node:crypto'

export function sha256(content: string) {
  return createHmac('sha256', process.env.PASSWORD_SECRET as string)
    .update(content)
    .digest('hex')
}

export function hashPassword(password: string) {
  return sha256(password)
}
