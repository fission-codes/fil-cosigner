import { Request, Response } from 'express'
import * as bls from 'noble-bls12-381'
import * as lotus from '../../lib/lotus'
import filecoin from 'webnative-filecoin'

const SERVER_PRIVATE_KEY =
  '4eeb8f66c557115a7ec37e7debc2b0b9130f0d4a2b74cd64ec478a88e2ac052c'
const SERVER_PUBLIC_KEY = filecoin.privToPub(SERVER_PRIVATE_KEY)

export const createKeyPair = (req: Request, res: Response): void => {
  const { publicKey } = req.body
  if (!publicKey) {
    res.status(400).send('Missing param: `publicKey`')
    return
  } else if (typeof publicKey !== 'string') {
    res.status(400).send('Ill-formatted param: `publicKey` should be a string')
    return
  }
  const fissionPubKey = bls.getPublicKey(SERVER_PRIVATE_KEY)
  res.status(200).send({ publicKey: fissionPubKey })
}

export const getWalletInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ownPubKey } = req.query
  if (!ownPubKey || typeof ownPubKey !== 'string') {
    res.status(400).send('Bad params')
    return
  }
  const address = filecoin.pubToAggAddress(SERVER_PUBLIC_KEY, ownPubKey)
  const attoFilBalance = await lotus.getBalance(address)
  const balance = filecoin.attoFilToFil(attoFilBalance)
  res.status(200).send({ address, balance })
}

export const getAggregatedAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ownPubKey } = req.query
  if (!ownPubKey || typeof ownPubKey !== 'string') {
    res.status(400).send('Bad params')
    return
  }
  const address = filecoin.pubToAggAddress(SERVER_PUBLIC_KEY, ownPubKey)
  res.status(200).send({ address })
}

export const getBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const address = req.params.address
  const attoFilBalance = await lotus.getBalance(address)
  const balance = filecoin.attoFilToFil(attoFilBalance)

  res.status(200).send({ balance })
}

export const getProviderAddress = async (
  _req: Request,
  res: Response
): Promise<void> => {
  // TODO: get from lotus node
  const address = 't1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na'
  res.status(200).send(address)
}

export const formatMsg = async (req: Request, res: Response): Promise<void> => {
  const { to, ownPubKey, amount } = req.query
  if (
    !to ||
    !ownPubKey ||
    !amount ||
    typeof to !== 'string' ||
    typeof ownPubKey !== 'string' ||
    typeof amount !== 'string'
  ) {
    res.status(400).send('Bad params')
    return
  }
  const amountNum = parseFloat(amount)
  if (typeof amountNum !== 'number') {
    res.status(400).send('Bad params')
    return
  }

  const attoAmount = filecoin.filToAttoFil(amountNum)
  const from = filecoin.pubToAggAddress(SERVER_PUBLIC_KEY, ownPubKey)

  const nonce = (await lotus.getNonce(from)) || 0

  const formatted = {
    Version: 0,
    To: to,
    From: from,
    Nonce: nonce,
    Value: attoAmount,
    GasLimit: 0,
    GasFeeCap: '0',
    GasPremium: '0',
    Method: 0,
    Params: '',
  }

  const message = await lotus.estimateGas(formatted)

  res.status(200).send({ ...message })
}

export const cosignMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const message = req.body.message as any

  console.log('message: ', message)

  const serverSigned = await filecoin.signLotusMessage(
    message.Message,
    SERVER_PRIVATE_KEY
  )

  const aggSig = filecoin.aggregateSigs(
    serverSigned.Signature.Data,
    message.Signature.Data
  )

  const aggMsg = {
    ...message,
    Signature: {
      ...message.Signature,
      Data: aggSig,
    },
  }

  const result = await lotus.sendMessage(aggMsg)
  res.status(200).send(result['/'])
}
