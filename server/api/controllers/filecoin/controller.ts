import { Request, Response } from 'express'
// import ucan from 'webnative/ucan'
import * as bls from 'noble-bls12-381'
import cbor from 'borc'
import axios from 'axios'
import zondax from '@zondax/filecoin-signing-tools'
import * as lotus from '../../lib/lotus'
import filecoinAddress from '@glif/filecoin-address'

const DUMMY_PRIVATE_KEY =
  '67d53f170b908cabb9eb326c3c337762d59289a8fec79f7bc9254b584b73265c'

export const createKeyPair = (req: Request, res: Response): void => {
  const { publicKey } = req.body
  if (!publicKey) {
    res.status(400).send('Missing param: `publicKey`')
    return
  } else if (typeof publicKey !== 'string') {
    res.status(400).send('Ill-formatted param: `publicKey` should be a string')
    return
  }
  const fissionPubKey = bls.getPublicKey(DUMMY_PRIVATE_KEY)
  res.status(200).send({ publicKey: fissionPubKey })
}

export const cosignMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // const decoded = ucan.decode(req.token)
  } catch (err) {
    res.status(401).send('Invalid UCAN')
    return
  }

  const { message } = req.body
  if (!message) {
    res.status(400).send('Missing param: `message`')
    return
  } else if (typeof message !== 'object') {
    res.status(400).send('Ill-formatted param: `message` should be an object')
    return
  }

  const serialized = cbor.encode(message)
  const sig = await bls.sign(serialized, DUMMY_PRIVATE_KEY)
  res.status(200).send({ sig: sig })
}

export const getBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const address = req.params.address
  const balance = await lotus.getBalance(address)
  res.status(200).send(balance)
}

export const getProviderAddress = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const address = 't1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na'
  res.status(200).send(address)
}

const LOTUS_ADDR = 't1hxbjgl7p2oexr2kckig6mkbw5t4qstjth54l2ja'

const FAKE_MSG = {
  Version: 0,
  To: 't3qsyutdetgkqwhh3hzdrpysnjxlqoz63iznqyf4jk3dbqzrrorq3qfgxk5ks6c2c7wjswpevze26i2gjtbera',
  From: 't1hxbjgl7p2oexr2kckig6mkbw5t4qstjth54l2ja',
  Nonce: 0,
  Value: '5000000000000000000',
  GasLimit: 992835,
  GasFeeCap: '900305',
  GasPremium: '392510',
  Method: 0,
  Params: '',
}

export const testMsg = async (req: Request, res: Response): Promise<void> => {
  const publicKey = bls.getPublicKey(DUMMY_PRIVATE_KEY)
  const publicKeyBuffer = Uint8Array.from(Buffer.from(publicKey as any, 'hex'))
  const address = filecoinAddress.newBLSAddress(publicKeyBuffer)
  const encoded = filecoinAddress.encode('t', address)
  console.log(encoded)

  const nonce = await lotus.getNonce(LOTUS_ADDR)
  const signed = await lotus.signMessage(LOTUS_ADDR, {
    ...FAKE_MSG,
    To: encoded,
    Nonce: nonce,
  })
  const result = await lotus.sendMessage(signed)
  console.log('RESULT: ', result)
  res.status(200).send()
}
