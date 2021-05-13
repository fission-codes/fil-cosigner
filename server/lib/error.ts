import { NextFunction } from 'express'

export const handle = async (
  next: NextFunction,
  fn: () => Promise<void>
): Promise<void> => {
  try {
    await fn()
  } catch (err) {
    next(err)
  }
}

export const raise = (code: number, msg: string): void => {
  const err = new Error(msg)
  // @ts-ignore
  err.status = code
  throw err
}

export const verifyStringParam = (
  param: any,
  name: string
): asserts param is string => {
  if (!param) {
    raise(400, `Missing param: '${name}' should be a string`)
  }
  if (typeof param !== 'string') {
    raise(400, `Bad param: '${name}' should be a string`)
  }
}
