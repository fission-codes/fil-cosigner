import { NextFunction, Request, Response } from 'express'
import * as lotus from '../lib/lotus'
import * as db from '../lib/db'
import * as error from '../lib/error'
import * as filecoin from 'webnative-filecoin'

// clunky but seems to be the best way to do this
const verifyStringParam: typeof error['verifyStringParam'] =
  error.verifyStringParam

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { publicKey, rootDid } = req.body
    verifyStringParam(publicKey, 'publicKey')
    verifyStringParam(rootDid, 'rootDid')

    const { address, aggPubKey } = await db.createServerKey(publicKey, rootDid)

    const [attoFilBalance, providerAddress] = await Promise.all([
      lotus.getBalance(address),
      lotus.defaultAddress(),
    ])
    const providerBalance = 0 // new account
    const balance = filecoin.attoFilToFil(attoFilBalance)
    res
      .status(200)
      .send({ address, balance, aggPubKey, providerBalance, providerAddress })
  })
}

export const get = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { publicKey } = req.query
    verifyStringParam(publicKey, 'publicKey')

    const keyInfo = await db.getAggKey(publicKey)
    if (keyInfo === null) {
      error.raise(404, 'Could not find user key')
    }

    const { address, aggPubKey } = keyInfo
    const [
      attoFilBalance,
      providerBalance,
      providerAddress,
    ] = await Promise.all([
      lotus.getBalance(address),
      db.getProviderBalance(publicKey),
      lotus.defaultAddress(),
    ])
    const balance = filecoin.attoFilToFil(attoFilBalance)
    res
      .status(200)
      .send({ address, balance, aggPubKey, providerBalance, providerAddress })
  })
}

export const getAggAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { publicKey } = req.query
    verifyStringParam(publicKey, 'publicKey')
    const keyInfo = await db.getAggKey(publicKey)
    if (keyInfo === null) {
      error.raise(404, 'Could not find user key')
    }

    const address = keyInfo.address
    res.status(200).send({ address })
  })
}

export const getBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const address = req.params.address
    verifyStringParam(address, 'address')

    const attoFilBalance = await lotus.getBalance(address)
    const balance = filecoin.attoFilToFil(attoFilBalance)
    res.status(200).send({ balance })
  })
}
