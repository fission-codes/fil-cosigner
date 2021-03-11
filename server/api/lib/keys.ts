import zondax from '@zondax/filecoin-signing-tools'
import filecoinAddress from '@glif/filecoin-address'
import * as bls from 'noble-bls12-381'

export const privToPubBuf = (privateB64: string, testNet: boolean): Buffer => {
  const key = zondax.keyRecoverBLS(privateB64, testNet)
  return Buffer.from(key.public_base64, 'base64')
}

export const pubBufToAddress = (publicKey: Buffer): string => {
  const rawAddress = filecoinAddress.newBLSAddress(publicKey)
  return filecoinAddress.encode('t', rawAddress)
}

export const privToAddress = (privateB64: string, testNet: boolean): string => {
  const publicKeyBuffer = privToPubBuf(privateB64, testNet)
  return pubBufToAddress(publicKeyBuffer)
}

export const toAggAddress = (
  key1B64: string,
  key2B64: string,
  testNet: boolean
): string => {
  const pubkey1 = privToPubBuf(key1B64, testNet)
  const pubkey2 = privToPubBuf(key2B64, testNet)
  const aggPubkey = bls.aggregatePublicKeys([pubkey1, pubkey2])
  return pubBufToAddress(Buffer.from(aggPubkey))
}

export const aggregateSigs = (sig1B64: string, sig2B64: string): string => {
  const sigs = [sig1B64, sig2B64].map((s) => Buffer.from(s, 'base64'))
  const aggSig = bls.aggregateSignatures(sigs)
  return Buffer.from(aggSig).toString('base64')
}
