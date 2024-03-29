import { createHmac, randomBytes } from 'node:crypto'
import { envConfig } from '~/constants/config'

export function sha256(content: string) {
  return createHmac('sha256', envConfig.passwordSecret).update(content).digest('hex')
}

export function hashPassword(password: string) {
  return sha256(password)
}

export function randomPassword(size: number) {
  return new Promise<string>((resolve, rejects) => {
    randomBytes(size, (error, buffer) => {
      if (error) {
        throw rejects(error)
      }

      return resolve(buffer.toString('hex'))
    })
  })
}
