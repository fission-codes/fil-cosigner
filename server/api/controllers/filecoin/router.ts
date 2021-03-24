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
  .post('/message', controller.cosignMessage)
