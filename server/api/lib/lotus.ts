import axios from 'axios'
import { CID } from 'webnative/ipfs'
import { Address, SignedMessage, MessageBody, CIDObj } from 'webnative-filecoin'
import { LotusWaitResp } from './types'

const RPC_API = 'http://127.0.0.1:1234/rpc/v0'
const request = {
  jsonrpc: '2.0',
  id: 1,
}

const AUTH = {
  headers: {
    Authorization: process.env.LOTUS_TOKEN,
  },
}

export const sendReq = async (method: string, params: any[]): Promise<any> => {
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
}

export const getBalance = async (address: string): Promise<string> => {
  const balance = sendReq('WalletBalance', [address])
  return balance === null ? '0' : balance
}

export const getNonce = async (address: string): Promise<number> => {
  return sendReq('MpoolGetNonce', [address])
}

export const validateAddress = async (address: string) => {
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
  return sendReq('WalletDefaultAddress', [])
}

export const currentBlockHeight = async (): Promise<number> => {
  const result = await sendReq('ChainHead', [])
  return result.Height
}
