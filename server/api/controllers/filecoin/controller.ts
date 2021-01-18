import FilecoinCosigningService from '../../services/filecoin.service';
import { Request, Response } from 'express';

export class Controller {
  createKeyPair(request: Request, response: Response): void {
    FilecoinCosigningService.createKeyPair(
      request.body.userPubKey,
      request.body.userOriginDid)
      .then((r) => {
        response.status(201)
          .location(`/api/v0/filecoin/keypair/${r.pairedPubKey}`);
      });
  }

  cosignMessage(request: Request, response: Response): void {
    // TODO: cosign message
  };
}
export default new Controller();
