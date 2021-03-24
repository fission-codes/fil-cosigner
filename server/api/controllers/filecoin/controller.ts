import { Request, Response } from 'express'
import * as bls from 'noble-bls12-381'
import customZondax from '@fission/filecoin-signing-tools/js'
import zondax from '@zondax/filecoin-signing-tools'
import base32Decode from 'base32-decode'
import blake from 'blakejs'
import * as lotus from '../../lib/lotus'
import * as keys from '../../lib/keys'

// const BLS_PRIVATE_KEY = 'TuuPZsVXEVp+w35968KwuRMPDUordM1k7EeKiOKsBSw='
const SERVER_PRIVATE_KEY =
  '4eeb8f66c557115a7ec37e7debc2b0b9130f0d4a2b74cd64ec478a88e2ac052c'
const SERVER_PUBLIC_KEY = keys.privToPub(SERVER_PRIVATE_KEY)

// const SECOND_KEY = 'PPQjuHt/0l4dJSVl5qOX9HEsxhdQBz+twl7nOP+MkFU='
// const SECOND_KEY =
// '3cf423b87b7fd25e1d252565e6a397f4712cc61750073fadc25ee738ff8c9055'

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

export const getBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const address = req.params.address
  const attoFilBalance = BigInt(await lotus.getBalance(address))
  const balance = Number(attoFilBalance / BigInt(1000000000000000)) / 1000

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

  const attoAmount = BigInt(amountNum * 1000) * BigInt(1000000000000000)
  const from = keys.pubToAggAddress(SERVER_PUBLIC_KEY, ownPubKey)
  const nonce = (await lotus.getNonce(from)) || 0

  const formatted = {
    Version: 0,
    To: to,
    From: from,
    Nonce: nonce,
    Value: attoAmount.toString(),
    GasLimit: 0,
    GasFeeCap: '0',
    GasPremium: '0',
    Method: 0,
    Params: '',
  }

  const message = await lotus.estimateGas(formatted)

  res.status(200).send({ ...message })
}

const MESSAGE_NO_NONCE = {
  Version: 0,
  To: 't1d7veanzlcxefpv7ayzq7jiwfbkhorv3sw5rk5ua',
  From:
    't3qsyutdetgkqwhh3hzdrpysnjxlqoz63iznqyf4jk3dbqzrrorq3qfgxk5ks6c2c7wjswpevze26i2gjtbera',
  Nonce: 4,
  Value: '1000000000000000000',
  GasLimit: 2563272,
  GasFeeCap: '101421',
  GasPremium: '100367',
  Method: 0,
  Params: '',
}

const CID_PREFIX = Buffer.from([0x01, 0x71, 0xa0, 0xe4, 0x02, 0x20])

const getCID = (message: Buffer) => {
  const blakeCtx = blake.blake2bInit(32)
  blake.blake2bUpdate(blakeCtx, message)
  const hash = Buffer.from(blake.blake2bFinal(blakeCtx))
  return Buffer.concat([CID_PREFIX, hash])
}

export const cosignMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const message = req.params.message as any

  const serialized = customZondax.transactionSerializeRaw(message)
  const digest = getCID(serialized)

  const signatureBuf = await bls.sign(digest, SERVER_PRIVATE_KEY)
  const signature = Buffer.from(signatureBuf).toString('base64')
  const serverSigned = {
    Message: message,
    Signature: {
      Data: signature,
      Type: 2,
    },
  }

  console.log(message)

  const aggSig = keys.aggregateSigs(
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

  const result = await lotus.sendMessage(message)
  console.log('RESULT: ', result)
  res.status(200).send()
}
