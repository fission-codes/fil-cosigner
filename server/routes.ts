import { Application } from 'express';
import examplesRouter from './api/controllers/examples/router';
import filecoinRouter from './api/controllers/filecoin/router';
export default function routes(app: Application): void {
  app.use('/api/v0/examples', examplesRouter);
  app.use('/api/v0/filecoin', filecoinRouter);
}
