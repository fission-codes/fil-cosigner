import { Client } from 'pg'
import filecoin from 'webnative-filecoin'
import crypto from 'crypto'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

client.connect()

export const createServerKey = async (userPubKey: string): Promise<string> => {
  const privkey = crypto.randomBytes(32).toString('hex')
  console.log()
  const serverPubKey = filecoin.privToPub(privkey)
  console.log(serverPubKey)
  const address = filecoin.pubToAggAddress(userPubKey, serverPubKey)
  try {
    await client.query(
      `INSERT INTO keypairs (userpubkey, privkey, address) 
       VALUES('${userPubKey}','${privkey}','${address}')`
    )
  } catch (err) {
    if (err.code === '23505') {
      throw new Error('User is already registered')
    } else {
      throw err
    }
  }
  return privkey
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

export const getKeyByAddress = async (
  address: string
): Promise<string | null> => {
  const res = await client.query(
    `SELECT * FROM keypairs WHERE address='${address}';`
  )
  if (res.rows.length === 0) {
    return null
  }
  return res.rows[0].privkey
}
