import FilecoinCosigningService from '../../services/filecoin.service';
import { Request, Response } from 'express';
import * as bls from 'noble-bls12-381'

const toHexString = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export const testing = async (request: Request, response: Response) => {
  const fromHexString = hexString =>
    new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  const privateKey = '67d53f170b908cabb9eb326c3c337762d59289a8fec79f7bc9254b584b73265c';
  const msg = fromHexString('hello');
  const publicKey = bls.getPublicKey(privateKey);
  const signature = await bls.sign(msg, privateKey);
  const isCorrect = await bls.verify(msg, publicKey, signature);

  // const msg = new Uint8Array([0, 1, 2, 3])
  // const msgHash = await bls.PointG2.hashToCurve(msg)
  // console.log('msgHash: ', msgHash)
  // const privateKeyStr = 'ed69a8c50cf8c9836be3b67c7eeff416612d45ba39a5c099d48fa668bf558c9c';
  // const privateKey = fromHexString(privateKeyStr)
  // console.log('privateKey: ', privateKey)
  // const publicKey = bls.getPublicKey(privateKey);
  // console.log('publicKey: ', publicKey)
  // const signature = await bls.sign(msg, privateKey);
  // console.log('signature: ', signature)
  // const isCorrect = await bls.verify(msg, publicKey, signature);
  // console.log('isCorrect: ', isCorrect)

  // const sk = [
  //   '67d53f170b908cabb9eb326c3c337762d59289a8fec79f7bc9254b584b73265c',
  //   '18f020b98eb798752a50ed0563b079c125b0db5dd0b1060d1c1b47d4a193e1e4'
  // ]
  // const pk = sk.map(k => bls.getPublicKey(k))
  // console.log("sk: ", sk)
  // console.log("pk: ", pk)

  // const sigs = await Promise.all(sk.map(k => bls.sign(msg, k)))

  // const aggPK = bls.aggregatePublicKeys(pk)
  // const aggSig = bls.aggregateSignatures(sigs)
  // console.log('sigs: ', sigs)
  // console.log('aggSig: ', aggSig)

  // const partialVerify = await bls.verify(msg, sigs[0], pk[0])
  // console.log('partialVerify: ', partialVerify)
  
  
  // const verified = await bls.verify(msg, aggSig, aggPK)
  // console.log("VERIFIED: ", verified)

  // return response
  //   .status(200)
  //   .json({
  //     sig: aggSig,
  //     pubkey: aggPK
  //   })

}

export const createKeyPair = (request: Request, response: Response): void =>  {
  // TODO: check UCAN validity
  // TODO: check key doesn't already exist
  FilecoinCosigningService.createKeyPair(
    request.body.userPubKey,
    request.body.userOriginDid)
    .then((r) => {
      response.status(201)
        .location(`/api/v0/filecoin/keypair/${r.pairedPubKey}`)
        .json(r);
    });
}

export const cosignMessage = (request: Request, response: Response): void => {
  // TODO: cosign message
};
