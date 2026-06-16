import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../types'

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err)

  let statusCode = 500
  let errorMessage = '服务器内部错误'

  if (err.name === 'ValidationError') {
    statusCode = 400
    errorMessage = err.message || '数据验证失败'
  } else if (err.name === 'NotFoundError') {
    statusCode = 404
    errorMessage = err.message || '资源不存在'
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    errorMessage = err.message || '未授权访问'
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403
    errorMessage = err.message || '权限不足'
  } else if (err.code === 'P2002') {
    statusCode = 400
    errorMessage = '数据已存在'
  } else if (err.code === 'P2025') {
    statusCode = 404
    errorMessage = '记录不存在'
  }

  const response: ApiResponse = {
    success: false,
    error: errorMessage
  }

  if (process.env.NODE_ENV === 'development') {
    response.message = err.stack
  }

  res.status(statusCode).json(response)
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  })
}
