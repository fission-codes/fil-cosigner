import axios from 'axios'
import * as error from './error'
import { CID } from 'webnative/dist/ipfs'
import { Address, SignedMessage, MessageBody, CIDObj } from 'webnative-filecoin'
import { LotusWaitResp } from './types'

const RPC_API = process.env.LOTUS_HOST || 'http://127.0.0.1:1234/rpc/v0'
const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS || null
const request = {
  jsonrpc: '2.0',
  id: 1,
}

let AUTH
if (process.env.LOTUS_TOKEN) {
  AUTH = {
    headers: {
      Authorization: process.env.LOTUS_TOKEN,
    },
  }
}

export const sendReq = async (
  method: string,
  params: unknown[]
): Promise<any> => {
  try {
    const response = await axios.post(
      RPC_API,
      {
        ...request,
        method: `Filecoin.${method}`,
        params,
      },
      AUTH
    )
    return response.data.result
  } catch (err) {
    error.raise(
      500,
      `Could not call ${method} on Lotus node: ${err.toString()}`
    )
  }
}

export const getBalance = async (address: string): Promise<string> => {
  const balance = sendReq('WalletBalance', [address])
  return balance === null ? '0' : balance
}

export const getActor = async (address: string): Promise<any> => {
  return sendReq('StateGetActor', [address])
}

export const validateAddress = async (address: string): Promise<boolean> => {
  return sendReq('WalletValidateAddress', [address])
}

export const signMessage = async (
  address: string,
  msg: MessageBody
): Promise<SignedMessage> => {
  return sendReq('WalletSignMessage', [address, msg])
}

export const sendMessage = async (msg: SignedMessage): Promise<CIDObj> => {
  return sendReq('MpoolPush', [msg])
}

export const estimateGas = async (msg: MessageBody): Promise<MessageBody> => {
  return sendReq('GasEstimateMessageGas', [msg, { MaxFee: '0' }, []])
}

export const waitMsg = async (
  cid: CID,
  threshold = 1
): Promise<LotusWaitResp> => {
  return sendReq('StateWaitMsg', [{ '/': cid }, threshold])
}

export const getMsg = async (cid: CID): Promise<MessageBody> => {
  return sendReq('ChainGetMessage', [{ '/': cid }])
}

export const defaultAddress = async (): Promise<Address> => {
  if (PROVIDER_ADDRESS) {
    return new Promise((resolve) => {
      resolve(PROVIDER_ADDRESS)
    })
  }
  return sendReq('WalletDefaultAddress', [])
}

export const currentBlockHeight = async (): Promise<number> => {
  const result = await sendReq('ChainHead', [])
  return result.Height
}
