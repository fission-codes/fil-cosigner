import axios from 'axios'

const RPC_API = 'http://127.0.0.1:1234/rpc/v0'
const request = {
  jsonrpc: '2.0',
  id: 1,
}

const BEARER_TOKEN =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.T3HSQoAWLdhtDS4pVJ3GRUNQ5RoLIN8teqEqdNpl350'

const AUTH = {
  headers: {
    Authorization: BEARER_TOKEN,
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
  return sendReq('WalletBalance', [address])
}

export const getNonce = async (address: string): Promise<number> => {
  return sendReq('MpoolGetNonce', [address])
}

export const validateAddress = async (address: string) => {
  return sendReq('WalletValidateAddress', [address])
}

export const verify = async (address: string, msg: string): Promise<any> => {
  return sendReq('WalletVerify', [address, msg])
}

export const signMessage = async (address: string, msg: any): Promise<any> => {
  return sendReq('WalletSignMessage', [address, msg])
}

export const sendMessage = async (msg: any): Promise<any> => {
  return sendReq('MpoolPush', [msg])
}

export const estimateGas = async (msg: any): Promise<any> => {
  return sendReq('GasEstimateMessageGas', [msg, { MaxFee: '0' }, []])
}
