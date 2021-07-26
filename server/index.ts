import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import bodyParser from 'body-parser'
import bearerToken from 'express-bearer-token'
import cors from 'cors'
import * as filecoin from 'webnative-filecoin'
import filecoinRouter from './filecoin'

// Configure webnative-filecoin from ENV
filecoin.setup.server({
  networkPrefix: process.env.NETWORK_PREFIX || 't',
  maxFil: Number.parseInt(process.env.MAX_FIL) || 1,
  expiry: Number.parseInt(process.env.EXPIRY) || 3600,
})

// make our server
const app = express()

// middleware
app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || '100kb' }))
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: process.env.REQUEST_LIMIT || '100kb',
  })
)
app.use(bodyParser.text({ limit: process.env.REQUEST_LIMIT || '100kb' }))
app.use(bearerToken())
app.use(cors())

// routes
app.use('/api/v1/filecoin', filecoinRouter)

// fire it ups
const port = parseInt(process.env.PORT)
app.listen(port, () => {
  console.log(`up and running at at http://localhost:${port}`)
})
