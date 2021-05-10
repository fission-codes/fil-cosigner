import { Client } from 'pg'

import dotenv from 'dotenv'
dotenv.config()

const client = new Client()
client.connect()

const createTables = async () => {
  await client.query(`
    CREATE TABLE keypairs (
      userpubkey VARCHAR(511) PRIMARY KEY,
      privkey    VARCHAR(511) NOT NULL,
      address    VARCHAR(511) NOT NULL,
      rootdid    VARCHAR(511) NOT NULL
    );
  `)

  await client.query(`
    CREATE TABLE transactions (
        userpubkey  VARCHAR(511) NOT NULL,
        messageId   VARCHAR(511) PRIMARY KEY,
        toAddress   VARCHAR(511) NOT NULL,
        fromAddress VARCHAR(511) NOT NULL,
        amount      BIGINT       NOT NULL,
        status      SMALLINT     NOT NULL,
        time        BIGINT       NOT NULL,
        blockheight INT,
        CONSTRAINT fk_keypair
          FOREIGN KEY(userpubkey)
          REFERENCES keypairs(userpubkey)
      );
  `)

  console.log('DONE!')
}

createTables()
