import {
  Network,
  Protocol,
  Address,
  newAddress,
  validateAddressString } from '@glif/filecoin-address';
import {
  LotusMessage,
  Signature,
  signingBytesLotusMessage,
  blsSignatureType } from './message';
import {
  BlsPrivateKey,
  BlsPublicKey,
  blsSign,
  blsVerify,
  getPublicKey } from '../crypto/bls12-381/operations';

/**
 * Cosigned Lotus Message explicitly specifies the address of the signer
 * which may differ from the `from` address field included in the message.
 * This is because for the final Lotus message to be broadcast, the from field
 * will specify the aggregated public key of two public keys:
 * the users' public key and the cosigners' public key.
 * In order to obtain the aggregated signature, the cosigned message includes
 * the signature of a single party and it must be verified as such against
 * the signer field, not against the `from` field in the message.
 */
export interface CosignedLotusMessage extends LotusMessage, Signature {
  address: Address;
  blsPublicKey: BlsPublicKey;
}

export const cosign = async (
  lotusMessage: LotusMessage,
  privateKey: BlsPrivateKey,
  network: Network
): Promise<CosignedLotusMessage> => {
  const signingBytes = signingBytesLotusMessage(lotusMessage)
  // sign the CID with secretKey
  // return msg, signature, & address of signer
  const signature = await blsSign(signingBytes, privateKey);
  const blsPublicKey = getPublicKey(privateKey);
  const address = newAddress(
    Protocol.BLS,
    blsPublicKey,
    network);
  const cosignedLotusMessage: CosignedLotusMessage = {
    ...lotusMessage,
    signatureBytes: signature, // data bytes of signature
    signatureType: blsSignatureType, // BLS signature type
    address: address, // address with BLS protocol and network specified
    blsPublicKey: blsPublicKey // keep BLS public key for aggregation
  };
  return Promise.resolve(cosignedLotusMessage);
}

export const verify = async (
  cosignedLotusMessage: CosignedLotusMessage): Promise<boolean> => {

  const signingBytes = signingBytesLotusMessage(cosignedLotusMessage);
  return blsVerify(
    cosignedLotusMessage.signatureBytes,
    signingBytes,
    cosignedLotusMessage.blsPublicKey);
}


// export const aggregate = (
//   msg1: CosignedLotusMessage,
//   msg2: CosignedLotusMessage
//   ): SignedLotusMessage => {

// }
