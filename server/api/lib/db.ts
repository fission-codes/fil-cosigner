import { Client } from 'pg'

const client = new Client({
  // connectionString: process.env.DATABASE_URL,
  connectionString: 'http://localhost:5432',
  ssl: {
    rejectUnauthorized: false,
  },
})

client.connect()
