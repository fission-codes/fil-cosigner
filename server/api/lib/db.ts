import { Client } from 'pg'
import * as filecoin from 'webnative-filecoin'
import { SignedMessage, Receipt, MessageStatus } from 'webnative-filecoin'
import crypto from 'crypto'
import * as lotus from './lotus'
import { PairedKeys, TransactionRaw } from './types'
import { CID } from 'webnative/ipfs'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

client.connect()

export const UserAlreadyRegistered = new Error('User is already registered')

export const createServerKey = async (userPubKey: string): Promise<string> => {
  const privkey = crypto.randomBytes(32).toString('hex')
  const serverPubKey = filecoin.privToPub(privkey)
  const address = filecoin.pubToAggAddress(userPubKey, serverPubKey)
  try {
    await client.query(
      `INSERT INTO keypairs (userpubkey, privkey, address) 
       VALUES('${userPubKey}','${privkey}','${address}')`
    )
  } catch (err) {
    if (err.code === '23505') {
      throw UserAlreadyRegistered
    } else {
      throw err
    }
  }
  return address
}

export const getAggAddress = async (
  userPubKey: string
): Promise<string | null> => {
  const privkey = await getMatchingKey(userPubKey)
  if (privkey === null) return null
  const serverPubKey = filecoin.privToPub(privkey)
  return filecoin.pubToAggAddress(userPubKey, serverPubKey)
}

export const getMatchingKey = async (
  userPubKey: string
): Promise<string | null> => {
  const res = await client.query(
    `SELECT * FROM keypairs WHERE userPubKey='${userPubKey}';`
  )
  if (res.rows.length === 0) {
    return null
  }
  return res.rows[0].privkey
}

export const getKeysByAddress = async (
  address: string
): Promise<PairedKeys | null> => {
  const res = await client.query(
    `SELECT * FROM keypairs WHERE address='${address}';`
  )
  if (res.rows.length === 0) {
    return null
  }
  return {
    userPubKey: res.rows[0].userpubkey,
    serverPrivKey: res.rows[0].privkey,
  }
}

export const addTransaction = async (
  userKey: string,
  messageId: string,
  message: SignedMessage
): Promise<void> => {
  const { Value, To, From } = message.Message
  await client.query(
    `INSERT INTO transactions (userpubkey, messageid, amount, toAddress, fromAddress, status, time)
     VALUES('${userKey}','${messageId}',${Value},'${To}','${From}',${
      MessageStatus.Sent
    },'${Date.now()}')`
  )
}

export const watchTransaction = async (
  userKey: string,
  messageId: string
): Promise<void> => {
  const waitResult = await lotus.waitMsg(messageId)
  await client.query(
    `UPDATE transactions 
     SET status = ${MessageStatus.Partial}, blockheight = ${waitResult.Height}
     WHERE userpubkey = '${userKey}'`
  )
  await lotus.waitMsg(messageId, 200)
  await client.query(
    `UPDATE transactions 
     SET status = ${MessageStatus.Verified}, blockheight = ${waitResult.Height}
     WHERE userpubkey = '${userKey}'`
  )
}

export const getReceipt = async (messageId: CID): Promise<Receipt | null> => {
  const res = await client.query(
    `SELECT * 
     FROM transactions
     WHERE messageid = '${messageId}'
    `
  )
  console.log('res: ', res)
  if (res.rows.length < 1) {
    return null
  }
  return txToReceipt(res.rows[0])
}

export const getReceiptsForUser = async (
  userKey: string
): Promise<Receipt[]> => {
  const res = await client.query(
    `SELECT * 
     FROM transactions
     WHERE userpubkey = '${userKey}'`
  )
  return res.rows.map(txToReceipt)
}

export const getProviderBalance = async (
  userKey: string
): Promise<number | null> => {
  const res = await client.query(
    `SELECT SUM(amount)
     FROM transactions
     WHERE userpubkey = '${userKey}'
    `
  )
  if (res.rows.length < 1) {
    return 0
  }
  return filecoin.attoFilToFil(res.rows[0].sum)
}

const txToReceipt = (tx: TransactionRaw): Receipt => ({
  messageId: tx.messageid,
  from: tx.fromaddress,
  to: tx.toaddress,
  amount: filecoin.attoFilToFil(tx.amount),
  time: parseInt(tx.time),
  blockheight: tx.blockheight,
  status: tx.status,
})
