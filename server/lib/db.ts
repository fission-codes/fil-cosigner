import { Client } from 'pg'
import * as filecoin from 'webnative-filecoin'
import { SignedMessage, Receipt, MessageStatus } from 'webnative-filecoin'
import crypto from 'crypto'
import * as lotus from './lotus'
import * as error from './error'
import { AggKeyAndAddr, PairedKeys, TransactionRaw } from './types'
import { CID } from 'webnative/dist/ipfs'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

client.connect()

export const UserAlreadyRegistered = new Error('User is already registered')

export const createServerKey = async (
  userPubKey: string,
  rootDid: string
): Promise<AggKeyAndAddr> => {
  const privkey = crypto.randomBytes(32).toString('hex')
  const serverPubKey = filecoin.privToPub(privkey)
  const aggPubKey = filecoin.aggKeys(userPubKey, serverPubKey)
  const address = filecoin.pubToAddress(aggPubKey)
  try {
    await client.query(
      `INSERT INTO keypairs (userpubkey, privkey, address, rootDid) 
       VALUES('${userPubKey}','${privkey}','${address}', '${rootDid}')`
    )
  } catch (err) {
    if (err.code === '23505') {
      error.raise(409, 'User is already registerd')
    } else {
      error.raise(500, 'Unknown database error')
    }
  }
  return { aggPubKey, address }
}

export const getAggKey = async (
  userPubKey: string
): Promise<AggKeyAndAddr | null> => {
  const privkey = await getMatchingKey(userPubKey)
  if (privkey === null) return null
  const serverPubKey = filecoin.privToPub(privkey)
  const aggPubKey = filecoin.aggKeys(userPubKey, serverPubKey)
  const address = filecoin.pubToAddress(aggPubKey)
  return { aggPubKey, address }
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
    rootDid: res.rows[0].rootdid,
  }
}

export const addTransaction = async (
  userKey: string,
  messageId: string,
  message: SignedMessage
): Promise<void> => {
  const { Value, To, From } = message.Message
  const picoValue = filecoin.attoFilToPicoFil(Value)
  await client.query(
    `INSERT INTO transactions (userpubkey, messageid, amount, toAddress, fromAddress, status, time)
     VALUES('${userKey}','${messageId}',${picoValue},'${To}','${From}',${
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
  const providerAddr = await lotus.defaultAddress()
  const res = await client.query(
    `SELECT SUM(amount)
     FROM transactions
     WHERE userpubkey = '${userKey}' AND toaddress = '${providerAddr}'
    `
  )
  if (res.rows.length < 1 || res.rows[0].sum === null) {
    return 0
  }
  return filecoin.picoFilToFil(res.rows[0].sum)
}

const txToReceipt = (tx: TransactionRaw): Receipt => ({
  messageId: tx.messageid,
  from: tx.fromaddress,
  to: tx.toaddress,
  amount: filecoin.picoFilToFil(tx.amount),
  time: parseInt(tx.time),
  blockheight: tx.blockheight,
  status: tx.status,
})
