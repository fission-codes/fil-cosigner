import FilecoinCosigningService from '../../services/filecoin.service';
import { Request, Response } from 'express';
import * as bls from 'noble-bls12-381'

const toHexString = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

const fromHexString = hexString =>
  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

export const testing = async (request: Request, response: Response) => {
  const msg = '64726e3da8';
  const sk = [
    '67d53f170b908cabb9eb326c3c337762d59289a8fec79f7bc9254b584b73265c',
    '18f020b98eb798752a50ed0563b079c125b0db5dd0b1060d1c1b47d4a193e1e4'
  ]
  const pk = sk.map(bls.getPublicKey)
  console.log("sk: ", sk)
  console.log("pk: ", pk)

  const sigs = await Promise.all(sk.map(k => bls.sign(msg, k)))

  const aggPK = bls.aggregatePublicKeys(pk as string[])
  const aggSig = bls.aggregateSignatures(sigs)
  console.log('sigs: ', sigs)
  console.log('aggSig: ', aggSig)
  console.log(aggSig.length)

  // const partialVerify = await bls.verify(msg, sigs[0], pk[0])
  // console.log('partialVerify: ', partialVerify)
  
  
  const verified = await bls.verify(aggSig, msg, aggPK)
  console.log("VERIFIED: ", verified)

  return response
    .status(200)
    .json({
      sig: aggSig,
      pubkey: aggPK
    })

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
