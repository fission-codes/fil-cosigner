import { Client } from 'pg'

import dotenv from 'dotenv'
dotenv.config()

const client = new Client()
client.connect()

const clearTxs = async () => {
  await client.query(`
    DELETE FROM transactions;
  `)
  console.log('DONE!')
}

clearTxs()
