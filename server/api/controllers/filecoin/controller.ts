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

const reverse = (input: string): string =>
  input.match(/.{2}/g).reverse().join('')

export const cosignMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  // const msg = 'Ynl0ZSBhcnJheQ=='
  // const signedLotus = await lotus.sign(
  //   't3qsyutdetgkqwhh3hzdrpysnjxlqoz63iznqyf4jk3dbqzrrorq3qfgxk5ks6c2c7wjswpevze26i2gjtbera',
  //   msg
  // )
  // console.log(signedLotus)

  // const privB64 = 'TuuPZsVXEVp+w35968KwuRMPDUordM1k7EeKiOKsBSw='
  // const privHex = Buffer.from(privB64, 'base64').toString('hex')
  // const reversed = reverse(privHex)
  // const signedBls = await bls.sign(Buffer.from(msg, 'base64'), reversed)
  // console.log(Buffer.from(signedBls).toString('base64'))

  // const { message } = req.body

  const MESSAGE = {
    ...MESSAGE_NO_NONCE,
    Nonce: await lotus.getNonce(MESSAGE_NO_NONCE.From),
  }

  // console.log('key: ', SERVER_PRIVATE_KEY)
  // console.log('key: ', reverse(SERVER_PRIVATE_KEY))

  // // const messageBody = message.Message

  const signed = await lotus.signMessage(MESSAGE.From, MESSAGE)
  console.log(signed)

  // const signedOG = zondax.transactionSignLotus(MESSAGE, Buffer.from(SERVER_PRIVATE_KEY, 'hex'))
  // const signatureOG = JSON.parse(signedOG).Signature.Data
  // console.log('signatureOG: ', JSON.parse(signedOG))
  // console.log(
  //   'signatureOG: ',
  //   Buffer.from(signatureOG, 'base64').toString('hex')
  // )

  // const zondaxKey = zondax.keyRecoverBLS(reverseKey, true)
  // console.log('zondaxKey: ', zondaxKey.public_hexstring)

  const reverseKey = Buffer.from(reverse(SERVER_PRIVATE_KEY), 'hex')
  const serialized = customZondax.transactionSerializeRaw(MESSAGE)

  const digest = getCID(serialized)

  const signatureBuf = await bls.sign(digest, reverseKey)
  const signature = Buffer.from(signatureBuf).toString('base64')
  // console.log('signature: ', Buffer.from(signature, 'base64').toString('hex'))
  const message = {
    Message: MESSAGE,
    Signature: {
      Data: signature,
      Type: 2,
    },
  }

  console.log(message)

  // const lotusSig = await lotus.sign(MESSAGE.From, digest.toString('base64'))
  // console.log('lotusSig: ', lotusSig)

  // const unparsed = zondax.transactionSignLotus(messageBody, SERVER_PRIVATE_KEY)
  // const signed = JSON.parse(unparsed)

  // const aggSig = keys.aggregateSigs(
  //   signed.Signature.Data,
  //   message.Signature.Data
  // )

  // const aggMsg = {
  //   ...message,
  //   Signature: {
  //     ...message.Signature,
  //     Data: aggSig,
  //   },
  // }
  // console.log('aggMsg: ', aggMsg)

  const result = await lotus.sendMessage(message)
  console.log('RESULT: ', result)
  res.status(200).send()
}

const ProtocolIndicator = {
  ID: 0,
  SECP256K1: 1,
  ACTOR: 2,
  BLS: 3,
}

const blsAddressAsBytes = (address: string): Buffer => {
  const protocolIndicator = address[1]
  const protocolIndicatorByte = `0${protocolIndicator}`
  console.log(protocolIndicator)
  if (Number(protocolIndicator) !== 3) {
    throw new Error('Not a BLS Address')
  }
  const address_decoded = base32Decode(
    address.slice(2).toUpperCase(),
    'RFC4648'
  )

  const payload = address_decoded.slice(0, -4)
  console.log('payload bytes: ', payload.byteLength)
  const checksum = Buffer.from(address_decoded.slice(-4))

  // if (payload.byteLength !== 20) {
  //   throw new InvalidPayloadLength();
  // }

  const bytes_address = Buffer.concat([
    Buffer.from(protocolIndicatorByte, 'hex'),
    Buffer.from(payload),
  ])

  // if (getChecksum(bytes_address).toString("hex") !== checksum.toString("hex")) {
  //   throw new InvalidChecksumAddress();
  // }
  return bytes_address
}

// const addressAsBytes = (address: string): Uint8Array => {
//   let address_decoded, payload, checksum
//   const protocolIndicator = address[1]
//   const protocolIndicatorByte = `0${protocolIndicator}`
//   console.log(protocolIndicator)

//   switch (Number(protocolIndicator)) {
//     case ProtocolIndicator.ID:
//       if (address.length > 18) {
//         throw new InvalidPayloadLength();
//       }
//       return Buffer.concat([
//         Buffer.from(protocolIndicatorByte, "hex"),
//         Buffer.from(leb.unsigned.encode(address.substr(2))),
//       ]);
//     case ProtocolIndicator.SECP256K1:
//       address_decoded = base32Decode(address.slice(2).toUpperCase(), "RFC4648");

//       payload = address_decoded.slice(0, -4);
//       checksum = Buffer.from(address_decoded.slice(-4));

//       if (payload.byteLength !== 20) {
//         throw new InvalidPayloadLength();
//       }
//       break;
//     case ProtocolIndicator.ACTOR:
//       address_decoded = base32Decode(address.slice(2).toUpperCase(), "RFC4648");

//       payload = address_decoded.slice(0, -4);
//       checksum = Buffer.from(address_decoded.slice(-4));

//       if (payload.byteLength !== 20) {
//         throw new InvalidPayloadLength();
//       }
//       break;
//     case ProtocolIndicator.BLS:
//       throw new ProtocolNotSupported("BLS");
//     default:
//       throw new UnknownProtocolIndicator();
//   }

//   // const bytes_address = Buffer.concat([
//   //   Buffer.from(protocolIndicatorByte, "hex"),
//   //   Buffer.from(payload),
//   // ]);

//   // if (getChecksum(bytes_address).toString("hex") !== checksum.toString("hex")) {
//   //   throw new InvalidChecksumAddress();
//   // }

// }
