import { Request, Response } from 'express'
// import ucan from 'webnative/ucan'
import * as bls from 'noble-bls12-381'
import cbor from 'borc'
import axios from 'axios'
import zondax from '@zondax/filecoin-signing-tools'

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
  const response = await axios.post('http://127.0.0.1:1234/rpc/v0', {
    jsonrpc: '2.0',
    method: `Filecoin.WalletBalance`,
    params: [address],
    id: 1,
  })
  res.status(200).send(response.data.result)
}

export const getProviderAddress = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const address = 't1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na'
  res.status(200).send(address)
}

const FAKE_MSG = {
  Version: 0,
  To: 't3q5cgdg2b6uzazz7sbkdjqoafxzvuagbawh76wamwazupvvwzol7glitxs4e2j2wd5ncsg2mltrdt2t6gdisa',
  From: 't1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na',
  Nonce: 0,
  Value: '10000000000000000000',
  GasLimit: 992835,
  GasFeeCap: '900305',
  GasPremium: '392510',
  Method: 0,
  Params: '',
}

const AUTH = {
  headers: {
    Authorization:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.-huzRN6d6k8_GlL9DEGweUtHsKZ84fVdfZfRySIPezI',
  },
}

export const testMsg = async (req: Request, res: Response): Promise<void> => {
  // const mnemonic = zondax.generateMnemonic()
  // const mnemonic =
  //   'rabbit path harbor solution bleak coyote joke stereo resist use size give zone portion zoo inspire grass witness grit prison ramp dutch lobster quiz'
  // const key = zondax.keyDerive(mnemonic, "m/44'/1'/0'/0'/0", 'test')
  // console.log(key.address)
  // const msg = zondax.transactionSignLotus(FAKE_MSG, key.private_base64)
  // console.log('MSG: ', msg)
  const nonceResp = await axios.post(
    'http://127.0.0.1:1234/rpc/v0',
    {
      jsonrpc: '2.0',
      method: `Filecoin.MpoolGetNonce`,
      params: ['t1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na'],
      id: 1,
    },
    AUTH
  )
  const nonce = nonceResp.data.result

  const sigResp = await axios.post(
    'http://127.0.0.1:1234/rpc/v0',
    {
      jsonrpc: '2.0',
      method: `Filecoin.WalletSignMessage`,
      params: ['t1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na', {
          ...FAKE_MSG,
          Nonce: nonce,
        },
      ],
      id: 1,
    },
    AUTH
  )
  const signed = sigResp.data.result
  console.log('SIGNED: ', signed)

  // const sigResp2 = await axios.post(
  //   'http://127.0.0.1:1234/rpc/v0',
  //   {
  //     jsonrpc: '2.0',
  //     method: `Filecoin.WalletSign`,
  //     params: [
  //       't1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na',
  //       {
  //         ...FAKE_MSG,
  //         Nonce: nonce,
  //       },
  //     ],
  //     id: 1,
  //   },
  //   AUTH
  // )
  // const sig = sigResp2.data.result
  // console.log('SIG: ', sig)

  try {
    const resp2 = await axios.post(
      'http://127.0.0.1:1234/rpc/v0',
      {
        jsonrpc: '2.0',
        method: `Filecoin.MpoolPush`,
        params: [signed],
        // params: [FAKE_MSG, { MaxFee: '0' }],
        id: 1,
      },
      AUTH
    )
    console.log('RESP: ', resp2.data)
  } catch (err) {
    console.log('ERR: ', err.response)
  }
  // const privKey = 'eyJUeXBlIjoic2VjcDI1NmsxIiwiUHJpdmF0ZUtleSI6Ilp2dGhSOEdXRkl3cGQzaHV1elZRTDE4MWgwdkgvcDY1WWtIb2dTUVpxd0U9In0='
  // const result = zondax.keyRecover(privKey, true)
  // console.log(result)
  // const address = 't1golw5yofvrksvnlxtiayovr7ptthae6n54ah6na'
  res.status(200).send()
}
