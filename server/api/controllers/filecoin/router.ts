import express from 'express'
import * as controller from './controller'
export default express
  .Router()
  .post('/keypair', controller.createKeyPair)
  .get('/format', controller.formatMsg)
  .get('/address', controller.getAggregatedAddress)
  .get('/wallet', controller.getWalletInfo)
  .get('/balance/:address', controller.getBalance)
  .get('/provider/address', controller.getProviderAddress)
  .get('/provider/balance/:publicKey', controller.getProviderBalance)
  .post('/message', controller.cosignMessage)
  .get('/message/:cid', controller.getMessageStatus)
  .get('/waitmsg/:cid', controller.waitForReceipt)
  .get('/receipts/:publicKey', controller.getPastReceipts)
  .get('/blockheight', controller.getBlockHeight)
