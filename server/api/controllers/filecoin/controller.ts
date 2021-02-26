import { Request, Response } from 'express'
import ucan from 'webnative/ucan'
import * as bls from 'noble-bls12-381'
import cbor from 'borc'

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

export const getBalances = async (
  req: Request,
  res: Response
): Promise<void> => {
  // const address = req.params.address
  res.status(200).send({ personal: 10, provider: 250.3 })
}

export const getProviderAddress = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const address = 't1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na'
  res.status(200).send(address)
}
