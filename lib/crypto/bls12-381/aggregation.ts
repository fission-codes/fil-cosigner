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

export const verify = async (
  signature: BlsSignature,
  signingBytes: BlsSigningBytes,
  publicKey: BlsPublicKey): Promise<boolean>  => {
  return bls.verify(signature, signingBytes, publicKey);
};

export const sign = async (
  signingBytes: BlsSigningBytes,
  privateKey: BlsPrivateKey): Promise<BlsSignature> => {
  return bls.sign(signingBytes, privateKey);
}
