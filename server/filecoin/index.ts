import express from 'express'
import * as wallet from './wallet'
import * as message from './message'
import * as storage from './storage'
import * as misc from './misc'

export default express
  .Router()

  // wallet
  .post('/wallet', wallet.create)
  .get('/wallet', wallet.get)
  .get('/address', wallet.getAggAddress)
  .get('/balance/:address', wallet.getBalance)

  // messages
  .get('/format', message.format)
  .post('/message', message.cosign)
  .get('/message/:cid', message.getStatus)
  .get('/waitmsg/:cid', message.waitForReceipt)
  .get('/receipts/:publicKey', message.getPastReceipts)

  // storage
  .get('/buildinfo', storage.getBuildInfo)

  // misc
  .get('/provider/address', misc.getProviderAddress)
  .get('/provider/balance/:publicKey', misc.getProviderBalance)
  .get('/blockheight', misc.getBlockHeight)
  .get('/did', misc.getServerDid)
