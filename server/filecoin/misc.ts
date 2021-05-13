import { NextFunction, Request, Response } from 'express'
import * as lotus from '../lib/lotus'
import * as db from '../lib/db'
import * as auth from '../lib/auth'
import * as error from '../lib/error'

// clunky but seems to be the best way to do this
const verifyStringParam: typeof error['verifyStringParam'] =
  error.verifyStringParam

export const getProviderAddress = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const address = await lotus.defaultAddress()
    res.status(200).send(address)
  })
}

export const getProviderBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { publicKey } = req.params
    verifyStringParam(publicKey, 'publicKey')

    const balance = await db.getProviderBalance(publicKey)
    res.status(200).send({ balance })
  })
}

export const getBlockHeight = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const height = await lotus.currentBlockHeight()
    res.status(200).send({ height })
  })
}

export const getServerDid = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.status(200).send({ did: auth.SERVER_DID })
}
