import { MessageStatus, CIDObj } from 'webnative-filecoin'

export type LotusReceipt = {
  ExitCode: number
  Return: string | null
  GasUsed: number
}

export type LotusWaitResp = {
  Message: CIDObj
  Recipet: LotusReceipt
  TipSet: CIDObj[]
  Height: number
}

export type PairedKeys = {
  userPubKey: string
  serverPrivKey: string
  rootDid: string
}

export type TransactionRaw = {
  messageid: string
  amount: string
  toaddress: string
  fromaddress: string
  status: MessageStatus
  time: string
  blockheight: number
}

export type Transaction = {
  messageId: string
  amount: string
  toAddress: string
  fromAddress: string
  status: MessageStatus
  time: number
  blockheight: number
}
