import express from 'express'
import * as controller from './controller'
export default express
  .Router()
  .post('/keypair', controller.createKeyPair)
  .post('/message', controller.cosignMessage)
  .get('/format', controller.formatMsg)
  .get('/balance/:address', controller.getBalance)
  .get('/provider/address', controller.getProviderAddress)
  .post('/test', controller.testMsg)
