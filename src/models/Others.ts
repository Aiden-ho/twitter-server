import { MediaType } from '~/constants/enum'

export interface Media {
  url: string
  type: MediaType // video, image
}

export interface SocketMessagePayload {
  content: string
  receiver_id: string
  sender_id: string
}
