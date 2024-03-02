import { HttpException } from '@nestjs/common';

export const responseBuilder = (
  code: number,
  success: boolean,
  message: string,
  body: any,
) => {
  return {
    statusCode: code,
    isSuccess: success,
    message: message,
    body: body,
  };
};

export const successHandler = (message: string, data: any) => {
  return responseBuilder(200, true, message || 'Success', data);
};

export const errorhandler = (code: number, errormessage: string) => {
  throw new HttpException(errormessage, code);
};
