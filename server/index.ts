import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import logger from 'pino-http'
import bodyParser from 'body-parser'
import bearerToken from 'express-bearer-token'
import cors from 'cors'
import filecoinRouter from './filecoin'

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
app.use(logger())

// routes
app.use('/api/v1/filecoin', filecoinRouter)

// fire it ups
const port = parseInt(process.env.PORT)
app.listen(port, () => {
  console.log(`up and running at at http://localhost:${port}`)
})
