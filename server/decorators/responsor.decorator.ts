import lodash from 'lodash'
import { reflector } from '@app/constants/reflector.constant'
import { HttpStatus, SetMetadata } from '@nestjs/common'
import { ResponseMessage } from '@app/interfaces/response.interface'
import * as META from '@app/constants/meta.constant'
import * as TEXT from '@app/constants/text.constant'
import { UNDEFINED } from '@app/constants/value.constant'

interface ResponsorOptions extends Omit<DecoratorCreatorOption, 'usePaginate'> {
  isApi?: boolean
  transform?: boolean
  paginate?: boolean
}
interface HandleOption {
  error?: HttpStatus
  success?: HttpStatus
  message: ResponseMessage
  usePaginate?: boolean
}

type HandleOptionConfig = ResponseMessage | HandleOption

export const getResponsorOptions = (target: any): ResponsorOptions => {
  return {
    isApi: reflector.get(META.HTTP_API, target),
    errorCode: reflector.get(META.HTTP_ERROR_CODE, target),
    successCode: reflector.get(META.HTTP_SUCCESS_CODE, target),
    errorMessage: reflector.get(META.HTTP_ERROR_MESSAGE, target),
    successMessage: reflector.get(META.HTTP_SUCCESS_MESSAGE, target),
    transform: reflector.get(META.HTTP_RESPONSE_TRANSFORM, target),
    paginate: reflector.get(META.HTTP_RESPONSE_TRANSFORM_TO_PAGINATE, target),
  }
}

export interface DecoratorCreatorOption {
  useApi?: boolean
  successMessage?: ResponseMessage
  successCode?: HttpStatus
  errorCode?: HttpStatus
  errorMessage?: ResponseMessage
  usePaginate?: boolean
}

const createDecorator = (options: DecoratorCreatorOption): MethodDecorator => {
  const { useApi, successCode, successMessage, errorCode, errorMessage, usePaginate } = options
  return (_, __, descriptor: PropertyDescriptor) => {
    SetMetadata(META.HTTP_RESPONSE_TRANSFORM, true)(descriptor.value)
    if (errorCode) {
      SetMetadata(META.HTTP_ERROR_CODE, errorCode)(descriptor.value)
    }
    if (successCode) {
      SetMetadata(META.HTTP_SUCCESS_CODE, successCode)(descriptor.value)
    }
    if (errorMessage) {
      SetMetadata(META.HTTP_ERROR_MESSAGE, errorMessage)(descriptor.value)
    }
    if (successMessage) {
      SetMetadata(META.HTTP_SUCCESS_MESSAGE, successMessage)(descriptor.value)
    }
    if (usePaginate) {
      SetMetadata(META.HTTP_RESPONSE_TRANSFORM_TO_PAGINATE, true)(descriptor.value)
    }
    if (useApi) {
      SetMetadata(META.HTTP_API, true)(descriptor.value)
    }
    return descriptor
  }
}

export const success = (message: ResponseMessage, statusCode?: HttpStatus) => {
  return createDecorator({
    successMessage: message,
    successCode: statusCode,
  })
}

export const api = (): MethodDecorator => {
  return createDecorator({ useApi: true })
}

export const paginate = (): MethodDecorator => {
  return createDecorator({ usePaginate: true })
}

export function handle(arg: HandleOptionConfig): MethodDecorator
export function handle(...args): MethodDecorator {
  const option = args[0]
  const isOption = (value: HandleOptionConfig): value is HandleOption => lodash.isObject(value)
  const message: ResponseMessage = isOption(option) ? option.message : option
  const errorMessage: ResponseMessage = message + TEXT.HTTP_ERROR_SUFFIX
  const successMessage: ResponseMessage = message + TEXT.HTTP_SUCCESS_SUFFIX
  const errorCode = isOption(option) ? option.error : UNDEFINED
  const successCode = isOption(option) ? option.success : UNDEFINED
  const usePaginate = isOption(option) ? option.usePaginate : false
  return createDecorator({
    errorCode,
    successCode,
    errorMessage,
    successMessage,
    usePaginate,
    useApi: true,
  })
}

export const Responsor = { api, handle, success, paginate }
