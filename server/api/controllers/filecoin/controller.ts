import { Request, Response } from 'express'
// import ucan from 'webnative/ucan'
import * as bls from 'noble-bls12-381'
import cbor from 'borc'
import zondax from '@zondax/filecoin-signing-tools'
import * as lotus from '../../lib/lotus'
import filecoinAddress from '@glif/filecoin-address'

const BLS_PRIVATE_KEY = 'TuuPZsVXEVp+w35968KwuRMPDUordM1k7EeKiOKsBSw='
const SECOND_KEY = 'PPQjuHt/0l4dJSVl5qOX9HEsxhdQBz+twl7nOP+MkFU='

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

export const blsPrivateToPublicBuf = (
  privateB64: string,
  testNet: boolean
): Buffer => {
  const key = zondax.keyRecoverBLS(privateB64, testNet)
  return Buffer.from(key.public_base64, 'base64')
}

export const pubKeyToAddress = (publicKey: Buffer): string => {
  const rawAddress = filecoinAddress.newBLSAddress(publicKey)
  return filecoinAddress.encode('t', rawAddress)
}

export const blsPrivateToAddress = (
  privateB64: string,
  testNet: boolean
): string => {
  const publicKeyBuffer = blsPrivateToPublicBuf(privateB64, testNet)
  return pubKeyToAddress(publicKeyBuffer)
}

export const blsKeysToAggAddress = (
  key1: string,
  key2: string,
  testNet: boolean
): string => {
  const pubkey1 = blsPrivateToPublicBuf(key1, testNet)
  const pubkey2 = blsPrivateToPublicBuf(key1, testNet)
  const aggPubkey = bls.aggregatePublicKeys([pubkey1, pubkey2])
  return pubKeyToAddress(Buffer.from(aggPubkey))
}

export const testMsg = async (req: Request, res: Response): Promise<void> => {
  const privKeyHex = Buffer.from(BLS_PRIVATE_KEY, 'base64').toString('hex')
  console.log('PRIV: ', privKeyHex)

  const pubKeyBuf = blsPrivateToPublicBuf(BLS_PRIVATE_KEY, true)
  const pubKeyHex = pubKeyBuf.toString('hex')
  console.log('PUB: ', pubKeyHex)

  return
  const aggAddress = blsKeysToAggAddress(BLS_PRIVATE_KEY, SECOND_KEY, true)
  console.log(aggAddress)
  // const address = blsPrivateToAddress(BLS_PRIVATE_KEY, true)
  // const address2 = blsPrivateToAddress(SECOND_KEY, true)
  // const privKeyHex = zondax.keyRecoverBLS(BLS_PRIVATE_KEY, true).private_hexstring
  const nonce = (await lotus.getNonce(aggAddress)) || 0
  // console.log('NONCE: ', nonce)

  const msg = {
    ...FAKE_MSG,
    nonce: nonce,
    from: aggAddress,
  }

  const unparsed1 = zondax.transactionSignLotus(msg, BLS_PRIVATE_KEY)
  const signed1 = JSON.parse(unparsed1)
  const unparsed2 = zondax.transactionSignLotus(msg, SECOND_KEY)
  const signed2 = JSON.parse(unparsed2)

  const sigData = [signed1, signed2].map((msg) => msg.Signature.Data)
  try {
    const agg = zondax.aggregateSignatures(sigData[0], sigData[1])
    console.log('AGG: ', agg)
  } catch (err) {
    console.log('ERR: ', err)
  }
  // const aggSig = Buffer.from(bls.aggregateSignatures(sigData)).toString(
  //   'base64'
  // )
  // console.log(aggSig)

  // const aggMsg = {
  //   ...signed1,
  //   Signature: {
  //     ...signed1.Signature,
  //     Data: aggSig,
  //   }
  // }

  // const result = await lotus.sendMessage(aggMsg)
  // console.log('aggMsg: ', aggMsg)
  // console.log('RESULT: ', result)
  res.status(200).send()
}
