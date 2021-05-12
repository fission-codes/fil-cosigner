import { Client } from 'pg'

import dotenv from 'dotenv'
dotenv.config()

const client = new Client()
client.connect()

const wipe = async () => {
  await client.query(`
    DELETE FROM transactions;
  `)
  await client.query(`
    DELETE FROM keypairs;
  `)
  console.log('DONE!')
}

wipe()
