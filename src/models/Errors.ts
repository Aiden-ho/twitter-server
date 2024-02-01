import HTTP_STATUS from '~/constants/httpStatus'

// VD: Record<string, string> == key[string]: string
type ErrorsType = Record<
  string,
  {
    [field: string]: {
      msg: string
      [key: string]: any
    }
  }
>
/**
 * Nếu extend Error thì express-validator thấy throw 1 error là object Error thì sẽ chỉ nhận msg
 * Nên ở đây tạo 1 class error động lập để có thể truyền status vào express-validator
 */
export class ErrorWithStatus {
  message: string
  status: number

  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class ErrorEntity extends ErrorWithStatus {
  errors: ErrorsType
  constructor({ message, errors }: { message: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
