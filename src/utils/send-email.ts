import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import path from 'path'
import fs from 'fs'
import { envConfig } from '~/constants/config'

//Create SES service object.
const sesClient = new SESClient({
  region: envConfig.awsRegion,
  credentials: {
    secretAccessKey: envConfig.awsSecretAccessKey,
    accessKeyId: envConfig.awsAccessKeyId
  }
})

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string
  toAddresses: string | string[]
  ccAddresses?: string | string[]
  body: string
  subject: string
  replyToAddresses?: string | string[]
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses] // người nhận
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress, //Nguồn từ người nào gửi
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses] //trả lời cho những địa chỉ nào
  })
}

export const sendVerifyEmail = async (toAddress: string, subject: string, body: string) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: envConfig.sesFromAddress,
    toAddresses: toAddress,
    body,
    subject
  })

  try {
    return await sesClient.send(sendEmailCommand)
  } catch (e) {
    console.error('Failed to send email.')
    throw e
  }
}

const defaultTemplateVerifyEmail = fs.readFileSync(path.resolve('src/templates/verify-email.html'), 'utf8')

export const sendVerifyEmailRegister = ({
  email,
  email_verify_token,
  template = defaultTemplateVerifyEmail
}: {
  email: string
  email_verify_token: string
  template?: string
}) => {
  const url = `${envConfig.clientUrl}/verify-email?token=${email_verify_token}`
  return sendVerifyEmail(
    email,
    'Verify your email',
    template
      .replace('{{Title}}', 'Final step...')
      .replace('{{content}}', 'Click the button to verify your email address.')
      .replace('{{url}}', url)
      .replace('{{expire_notice}}', 'If you don’t use this link within 3 days, it will expire.')
      .replace('{{reason}}', "You're receiving this email because the system want to verify your email.")
  )
}

export const sendEmailForgotPassword = ({
  email,
  forgot_password_token,
  template = defaultTemplateVerifyEmail
}: {
  email: string
  forgot_password_token: string
  template?: string
}) => {
  const url = `${envConfig.clientUrl}/forgot-password?token=${forgot_password_token}`
  return sendVerifyEmail(
    email,
    'Please reset your password',
    template
      .replace('{{Title}}', 'Reset Password')
      .replace('{{content}}', 'Click the button to reset your password.')
      .replace('{{url}}', url)
      .replace('{{expire_notice}}', 'If you don’t use this link within 3 days, it will expire.')
      .replace('{{reason}}', "You're receiving this email because a password reset was requested for your account.")
  )
}
