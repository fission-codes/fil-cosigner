import { CIDObj } from 'webnative-filecoin'

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

export enum MessageStatus {
  Sent = 0,
  Partial = 1,
  Verified = 2,
}

export type PairedKeys = {
  userPubKey: string
  serverPrivKey: string
}

export type Transaction = {
  messageId: string
  amount: string
  toAddress: string
  fromAddress: string
  completed: MessageStatus
  time: number
  blockheight: number
}
