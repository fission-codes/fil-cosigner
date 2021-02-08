import { assert } from 'chai';
import * as bls from 'noble-bls12-381';

// Filecoin specification on BLS12-381 usage
// https://spec.filecoin.io/algorithms/crypto/signatures/
// Filecoin uses G1 for public keys and G2 for signatures
// https://github.com/paulmillr/noble-bls12-381


export type BlsSignature = Uint8Array;
export type BlsPublicKey = Uint8Array;
export type BlsPrivateKey = Uint8Array;

export type BlsSigningBytes = Uint8Array;
export type BlsMessageBytes = Uint8Array;

export const getPublicKey = (privateKey: BlsPrivateKey): BlsPublicKey => {
  // can return string | Uint8Array as public key;
  // but we know explicitly that it's always Uint8Array; ts-compiler isnt so smart
  const pubKeyBytes: Uint8Array | string = bls.getPublicKey(privateKey);
  // bls.hexToBytes isnt exported, so this doesnt work
  // return typeof pubKeyBytes === 'string' ? bls.hexToBytes(pubKeyBytes) : pubKeyBytes;

  // ben (4feb): my reasoning here is, minimise code paths early and in alpha codebase,
  //             crash hard and early and make explicit assertions; these can be removed over time
  assert(pubKeyBytes instanceof Uint8Array,
    'unimplemented in bls_aggregation, pub key should always be uint8Array');
  return <Uint8Array>pubKeyBytes;
};

export const blsVerify = async (
  signature: BlsSignature,
  signingBytes: BlsSigningBytes,
  publicKey: BlsPublicKey): Promise<boolean>  => {
  return bls.verify(signature, signingBytes, publicKey);
};

export const blsSign = async (
  signingBytes: BlsSigningBytes,
  privateKey: BlsPrivateKey): Promise<BlsSignature> => {
  return bls.sign(signingBytes, privateKey);
};


function
