import * as bls from 'noble-bls12-381';

// Filecoin specification on BLS12-381 usage
// https://spec.filecoin.io/algorithms/crypto/signatures/
// Filecoin uses G1 for public keys and G2 for signatures
// https://github.com/paulmillr/noble-bls12-381


type BlsSignature = Uint8Array;
type BlsPublicKey = Uint8Array;
type BlsPrivateKey = Uint8Array;

type BlsSignatureBytes = Uint8Array;
type BlsMessageBytes = Uint8Array;

export const verify = async (
  signature: BlsSignature,
  message: BlsMessageBytes,
  publicKey: BlsPublicKey): Promise<boolean>  => {
  return bls.verify(signature, message, publicKey);
};

export const sign = async (
  message: BlsMessageBytes,
  privateKey: BlsPrivateKey): Promise<BlsSignatureBytes> => {
  return bls.sign(message, privateKey);
}
