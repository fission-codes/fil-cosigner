import { Client } from 'pg'

import dotenv from 'dotenv'
dotenv.config()

const client = new Client()
client.connect()

const wipe = async () => {
  await client.query(`
    DROP TABLE transactions;
  `)
  await client.query(`
    DROP TABLE keypairs;
  `)
  console.log('DONE!')
}

wipe()
