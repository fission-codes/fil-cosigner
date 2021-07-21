import { NextFunction, Request, Response } from 'express'
import * as lotus from '../lib/lotus'
import * as db from '../lib/db'
import * as error from '../lib/error'
import * as filecoin from 'webnative-filecoin'
import * as auth from '../lib/auth'
import { MessageStatus } from 'webnative-filecoin'

// clunky but seems to be the best way to do this
const verifyStringParam: typeof error['verifyStringParam'] =
  error.verifyStringParam

export const format = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { to, ownPubKey, amount } = req.query
    verifyStringParam(to, 'to')
    verifyStringParam(ownPubKey, 'ownPubKey')
    verifyStringParam(amount, 'amount')
    const amountNum = parseFloat(amount)
    if (typeof amountNum !== 'number') {
      error.raise(400, 'Bad param: `amount` should be a parsable to a float')
    }

    const attoAmount = filecoin.filToAttoFil(amountNum)
    const keyInfo = await db.getAggKey(ownPubKey)
    if (keyInfo === null) {
      error.raise(404, 'Could not find user key')
      return
    }
    const from = keyInfo.address
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
  })
}

export const cosign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const message = req.body.message
    if (!filecoin.isMessage(message)) {
      error.raise(400, 'Bad param, `message` should be a signed FIL message')
    }

    const { serverPrivKey, userPubKey, rootDid } = await db.getKeysByAddress(
      message.Message.From
    )
    if (serverPrivKey === null) {
      error.raise(404, 'Could not find user key')
    }

    const amount = filecoin.attoFilToFil(message.Message.Value)
    await auth.validateUCAN(req.token, message.Message.From, rootDid, amount)

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
      error.raise(500, 'Could not send message')
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
  })
}

export const getStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { cid } = req.params
    verifyStringParam(cid, 'cid')

    const maybeReceipt = await db.getReceipt(cid)
    if (maybeReceipt === null) {
      error.raise(404, `Message not found: ${cid}`)
      return
    }
    res.status(200).send(maybeReceipt)
  })
}

export const waitForReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { cid } = req.params
    verifyStringParam(cid, 'cid')
    let waitResult, msg

    try {
      waitResult = await lotus.waitMsg(cid as string)
      msg = await lotus.getMsg(cid as string)
    } catch (e) {
      error.raise(500, e.toString())
    }
    res.status(200).send({
      cid: cid,
      from: msg.From,
      to: msg.To,
      amount: filecoin.attoFilToFil(msg.Value),
      blockHeight: waitResult.Height,
    })
  })
}

export const getPastReceipts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  error.handle(next, async () => {
    const { publicKey } = req.params
    verifyStringParam(publicKey, 'publicKey')

    const receipts = await db.getReceiptsForUser(publicKey)
    res.status(200).send(receipts)
  })
}
