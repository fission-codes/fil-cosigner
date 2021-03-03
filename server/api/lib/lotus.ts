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

export const getBalance = async (address: string): Promise<string> => {
  const response = await axios.post(RPC_API, {
    ...request,
    method: `Filecoin.WalletBalance`,
    params: [address],
  })
  console.log(response.data)
  return response.data.result
}

export const getNonce = async (address: string): Promise<number> => {
  const response = await axios.post(
    RPC_API,
    {
      ...request,
      method: `Filecoin.MpoolGetNonce`,
      params: [address],
    },
    AUTH
  )
  return response.data.result
}

export const signMessage = async (address: string, msg: any): Promise<any> => {
  const response = await axios.post(
    RPC_API,
    {
      ...request,
      method: `Filecoin.WalletSignMessage`,
      params: [address, msg],
    },
    AUTH
  )
  return response.data.result
}

export const sendMessage = async (msg: any): Promise<any> => {
  const response = await axios.post(
    RPC_API,
    {
      ...request,
      method: `Filecoin.MpoolPush`,
      params: [msg],
    },
    AUTH
  )
  return response.data.result
}
