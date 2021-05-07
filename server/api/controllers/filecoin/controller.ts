import { Request, Response } from 'express'
import * as lotus from '../../lib/lotus'
import * as db from '../../lib/db'
import * as filecoin from 'webnative-filecoin'
import * as auth from '../../lib/auth'
import { MessageStatus } from 'webnative-filecoin'

export const createKeyPair = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { publicKey } = req.body
  if (!publicKey) {
    res.status(400).send('Missing param: `publicKey`')
    return
  } else if (typeof publicKey !== 'string') {
    res.status(400).send('Ill-formatted param: `publicKey` should be a string')
    return
  }
  try {
    const address = await db.createServerKey(publicKey)
    const attoFilBalance = await lotus.getBalance(address)
    const balance = filecoin.attoFilToFil(attoFilBalance)
    res.status(200).send({ address, balance })
  } catch (err) {
    if (err === db.UserAlreadyRegistered) {
      res.status(409).send(err.toString())
    } else {
      res.status(500).send(err.toString())
    }
  }
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
  const address = await db.getAggAddress(ownPubKey)
  if (address === null) {
    res.status(404).send('Could not find user key')
    return
  }
  const [attoFilBalance, providerBalance] = await Promise.all([
    lotus.getBalance(address),
    db.getProviderBalance(ownPubKey),
  ])
  const balance = filecoin.attoFilToFil(attoFilBalance)
  res.status(200).send({ address, balance, providerBalance })
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
  const address = await db.getAggAddress(ownPubKey)
  if (address === null) {
    res.status(404).send('Could not find user key')
    return
  }
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
  const address = await lotus.defaultAddress()
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
  const from = await db.getAggAddress(ownPubKey)
  if (from === null) {
    res.status(404).send('Could not find user key')
    return
  }

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
  const isValid = await auth.validateUCAN(req.token)

  const message = req.body.message
  if (!filecoin.isMessage(message)) {
    res.status(400).send('Bad params')
    return
  }

  const { serverPrivKey, userPubKey } = await db.getKeysByAddress(
    message.Message.From
  )
  if (serverPrivKey === null) {
    res.status(404).send('Could not find user key')
    return
  }

  const serverSigned = await filecoin.signLotusMessage(
    message.Message,
    serverPrivKey
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
  const cid = result['/']
  if (typeof cid !== 'string') {
    throw new Error('Could not send message')
  }

  await db.addTransaction(userPubKey, cid, message)
  db.watchTransaction(userPubKey, cid)

  res.status(200).send({
    messageId: cid,
    from: aggMsg.Message.From,
    to: aggMsg.Message.To,
    amount: filecoin.attoFilToFil(aggMsg.Message.Value),
    time: Date.now(),
    blockheight: null,
    status: MessageStatus.Sent,
  })
}

export const waitForReceipt = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { cid } = req.params
  const waitResult = await lotus.waitMsg(cid as string)
  const msg = await lotus.getMsg(cid as string)

  res.status(200).send({
    cid: cid,
    from: msg.From,
    to: msg.To,
    amount: filecoin.attoFilToFil(msg.Value),
    blockHeight: waitResult.Height,
  })
}

export const getPastReceipts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { publicKey } = req.params
  if (!publicKey) {
    res.status(400).send('Missing param: `publicKey`')
    return
  } else if (typeof publicKey !== 'string') {
    res.status(400).send('Ill-formatted param: `publicKey` should be a string')
    return
  }

  const receipts = await db.getReceiptsForUser(publicKey)
  res.status(200).send(receipts)
}

export const getMessageStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { cid } = req.params
  if (!cid) {
    res.status(400).send('Missing param: `cid`')
    return
  } else if (typeof cid !== 'string') {
    res.status(400).send('Ill-formatted param: `cid` should be a string')
    return
  }
  const maybeReceipt = await db.getReceipt(cid)
  if (maybeReceipt === null) {
    res.status(404).send(`Message not found: ${cid}`)
    return
  }
  res.status(200).send(maybeReceipt)
}

export const getProviderBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { publicKey } = req.params
  if (!publicKey) {
    res.status(400).send('Missing param: `publicKey`')
    return
  } else if (typeof publicKey !== 'string') {
    res.status(400).send('Ill-formatted param: `publicKey` should be a string')
    return
  }
  const balance = await db.getProviderBalance(publicKey)
  res.status(200).send({ balance })
}

export const getBlockHeight = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const height = await lotus.currentBlockHeight()
  res.status(200).send({ height })
}
