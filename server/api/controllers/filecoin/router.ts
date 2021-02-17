import express from 'express'
import * as controller from './controller'
export default express
  .Router()
  .post('/keypair', controller.createKeyPair)
  .post('/message', controller.cosignMessage)
