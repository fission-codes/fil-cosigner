import { Request, Response } from 'express'
// import ucan from 'webnative/ucan'
import * as bls from 'noble-bls12-381'
import cbor from 'borc'
import zondax from '@zondax/filecoin-signing-tools'
import * as lotus from '../../lib/lotus'
import filecoinAddress from '@glif/filecoin-address'

const BLS_PRIVATE_KEY = 'TuuPZsVXEVp+w35968KwuRMPDUordM1k7EeKiOKsBSw='

const DUMMY_PRIVATE_KEY =
  '4eeb8f66c557115a7ec37e7debc2b0b9130f0d4a2b74cd64ec478a88e2ac052c'

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
  const attoFilBalance = BigInt(await lotus.getBalance(address))
  const balance = Number(attoFilBalance / BigInt(1000000000000000)) / 1000

  res.status(200).send({ balance })
}

export const getProviderAddress = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const address = 't1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na'
  res.status(200).send(address)
}

const LOTUS_ADDR = 't1hxbjgl7p2oexr2kckig6mkbw5t4qstjth54l2ja'

// const FAKE_MSG = {
//   Version: 0,
//   To: 't1hxbjgl7p2oexr2kckig6mkbw5t4qstjth54l2ja',
//   From:
//     't3qsyutdetgkqwhh3hzdrpysnjxlqoz63iznqyf4jk3dbqzrrorq3qfgxk5ks6c2c7wjswpevze26i2gjtbera',
//   Nonce: 0,
//   Value: '5000000000000000000',
//   GasLimit: 992835,
//   GasFeeCap: '900305',
//   GasPremium: '392510',
//   Method: 0,
//   Params: '',
// }

const FAKE_MSG = {
  version: 0,
  to: 't1hxbjgl7p2oexr2kckig6mkbw5t4qstjth54l2ja',
  from:
    't3qsyutdetgkqwhh3hzdrpysnjxlqoz63iznqyf4jk3dbqzrrorq3qfgxk5ks6c2c7wjswpevze26i2gjtbera',
  nonce: 0,
  value: '5000000000000000000',
  gasLimit: 992835,
  gasFeeCap: '900305',
  gasPremium: '392510',
  method: 0,
  params: '',
}

export const blsPrivateToAddress = (
  privateB64: string,
  testNet: boolean
): string => {
  const key = zondax.keyRecoverBLS(privateB64, testNet)
  const publicKeyBuffer = Buffer.from(key.public_base64, 'base64')
  const rawAddress = filecoinAddress.newBLSAddress(publicKeyBuffer)
  return filecoinAddress.encode('t', rawAddress)
}

export const testMsg = async (req: Request, res: Response): Promise<void> => {
  // console.log(zondax)
  const address = blsPrivateToAddress(BLS_PRIVATE_KEY, true)
  // const privKeyHex = zondax.keyRecoverBLS(BLS_PRIVATE_KEY, true).private_hexstring
  const nonce = await lotus.getNonce(address)

  const msg = {
    ...FAKE_MSG,
    nonce: nonce,
    from: address,
  }

  const unparsed = zondax.transactionSignLotus(msg, BLS_PRIVATE_KEY)
  const signed = JSON.parse(unparsed)
  const result = await lotus.sendMessage(signed)
  console.log('signed: ', signed)
  console.log('RESULT: ', result)
  res.status(200).send()
}
