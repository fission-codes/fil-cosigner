import express from 'express';
import controller from './controller';
export default express
  .Router()
  .post('/keypairs', controller.createKeyPair)
  .post('/messages', controller.cosignMessage);
