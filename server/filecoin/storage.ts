import { NextFunction, Request, Response } from 'express'
import * as powergate from '../lib/powergate'
import * as error from '../lib/error'

// clunky but seems to be the best way to do this
const verifyStringParam: typeof error['verifyStringParam'] =
  error.verifyStringParam

export const getBuildInfo = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const info = await powergate.getBuildInfo()
    res.status(200).send(info)
  })
}

export const store = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { cid } = req.params
    verifyStringParam(cid, 'cid')
    const info = await powergate.store(cid)
    res.status(200).send(info)
  })
}
