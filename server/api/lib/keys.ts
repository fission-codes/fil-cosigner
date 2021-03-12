import zondax from '@zondax/filecoin-signing-tools'
import filecoinAddress from '@glif/filecoin-address'
import * as bls from 'noble-bls12-381'

export const hexToBase64 = (hex: string): string => {
  return Buffer.from(hex, 'hex').toString('base64')
}

export const privToPub = (privateHex: string): string => {
  const privateB64 = hexToBase64(privateHex)
  const key = zondax.keyRecoverBLS(privateB64, true)
  return key.public_hexstring
}

export const privToPubBuf = (privateHex: string): Buffer => {
  const pubkey = privToPub(privateHex)
  return Buffer.from(pubkey, 'hex')
}

export const pubBufToAddress = (publicKey: Buffer): string => {
  const rawAddress = filecoinAddress.newBLSAddress(publicKey)
  return filecoinAddress.encode('t', rawAddress)
}

export const privToAddress = (privateHex: string): string => {
  const publicKeyBuffer = privToPubBuf(privateHex)
  return pubBufToAddress(publicKeyBuffer)
}

export const privToAggAddress = (key1: string, key2: string): string => {
  const pubkey1 = privToPubBuf(key1)
  const pubkey2 = privToPubBuf(key2)
  return pubBufToAggAddress(pubkey1, pubkey2)
}

export const pubToAggAddress = (key1: string, key2: string): string => {
  const pubkey1 = Buffer.from(key1, 'hex')
  const pubkey2 = Buffer.from(key2, 'hex')
  return pubBufToAggAddress(pubkey1, pubkey2)
}

export const pubBufToAggAddress = (
  pubkey1: Buffer,
  pubkey2: Buffer
): string => {
  const aggPubkey = bls.aggregatePublicKeys([pubkey1, pubkey2])
  return pubBufToAddress(Buffer.from(aggPubkey))
}

export const aggregateSigs = (sig1B64: string, sig2B64: string): string => {
  const sigs = [sig1B64, sig2B64].map((s) => Buffer.from(s, 'base64'))
  const aggSig = bls.aggregateSignatures(sigs)
  return Buffer.from(aggSig).toString('base64')
}
