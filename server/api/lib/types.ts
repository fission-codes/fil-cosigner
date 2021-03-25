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
