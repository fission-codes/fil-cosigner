import express from 'express';
import * as controller from './controller';
export default express
  .Router()
  .get('/testing', controller.testing)
  .post('/keypairs', controller.createKeyPair)
  .post('/messages', controller.cosignMessage);
