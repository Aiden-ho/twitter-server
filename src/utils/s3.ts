import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { Response } from 'express'
import fs from 'fs'
import { envConfig } from '~/constants/config'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'

const s3 = new S3({
  region: envConfig.awsRegion,
  credentials: {
    secretAccessKey: envConfig.awsSecretAccessKey,
    accessKeyId: envConfig.awsAccessKeyId
  }
})

export const uploadFileToS3 = ({
  fileName,
  filePath,
  contentType
}: {
  fileName: string
  filePath: string
  contentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: envConfig.awsS3Bucket,
      Key: fileName,
      Body: fs.readFileSync(filePath),
      ContentType: contentType
    },

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 50, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })

  return parallelUploads3.done()
}

export const sendFilefromS3 = async (res: Response, filePath: string) => {
  try {
    const data = await s3.getObject({
      Bucket: envConfig.awsS3Bucket,
      Key: filePath
    })

    ;(data.Body as any).pipe(res)
  } catch (error) {
    console.error(error)
    res.status(HTTP_STATUS.NOT_FOUND).send(USER_MESSAGES.NOT_FOUND)
  }
}

export const streamFileFromS3 = async (res: Response, filePath: string) => {}
