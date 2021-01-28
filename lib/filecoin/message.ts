import BigNumber from 'bignumber.js';
import { Either, left, right } from "fp-ts/lib/Either";
import { validateAddressString } from '@glif/filecoin-address';
import { tryCatch } from 'fp-ts/lib/Option';
// import * as filecoinMessage from '@glif/filecoin-message';

BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_HALF_DOWN });
BigNumber.config({ EXPONENTIAL_AT: 1e9 });

export class InvalidLotusMessage extends Error {}

// user-stories
// - validate filecoin messages
// - sign filecoin messages
// - verify signed filecoin messages

/**
 * Lotus Message is a base fee message that can be serialised and signed
 * reference https://github.com/filecoin-project/lotus/blob/master/chain/types/message.go#L30
 */
export interface LotusMessage {
  to: string;
  from: string;
  nonce: number;
  value: string;
  gasPremium: string;
  gasLimit: number;
  gasFeeCap: string;
  method: number;
  params?: string | string[];
}

/**
 * Signature has a type number and a data string.
 * The type number is
 *   - '0' for secp256k1 signatures
 *   - '1' for BLS12-381 signatures
 *   - '255' (MaxUint8) for unknown signature type
 * The Data string is the bytestring of the signature
 * https://github.com/filecoin-project/go-state-types/blob/95828685f9df463f052a5d42b8f6c2502f873ceb/crypto/signature.go
 */
export interface Signature {
  type: number; // 0 for secp; 1 for bls;
  data: string; // byte string
}

/**
 * Signed Lotus Message combines a Lotus message with a signature.
 */
export interface SignedLotusMessage extends LotusMessage, Signature {};

/**
 * Cast to Lotus Message returns either a construction error or a valid lotus
 * message.
 */
export const castToLotusMessage = (rawMessage: any): Either<InvalidLotusMessage, LotusMessage> => {

  if (!('to' in rawMessage) || typeof rawMessage.to !== 'string') {
    return left(new InvalidLotusMessage(
      "'to is a required field and has to be a string"));
  }
  if (!('from' in rawMessage) || typeof rawMessage.from !== 'string') {
    return left(new InvalidLotusMessage(
      "'from' is a required field and has to be a string"));
  }
  if (!validateAddressString(rawMessage.to)) {
    return left(new InvalidLotusMessage('invalid to address provided'));
  }
  if (!validateAddressString(rawMessage.from)) {
    return left(new InvalidLotusMessage('invalid from address provided'))
  }
  if (!('nonce' in rawMessage) || typeof rawMessage.nonce !== 'number') {
    return left(new InvalidLotusMessage(
      "'nonce' is a required field and has to be a number"));
  }
  if (!('value' in rawMessage) || typeof rawMessage.value !== 'string') {
    return left(new InvalidLotusMessage(
      "'value' is a required field and has to be a string"));
  }
  const valueCheckBN
  if (!)


  const message: LotusMessage = {
    to: 'abc',
    from: 'def',
    nonce: 0,
    value: '0',
    gasPremium: '0',
    gasLimit: 0,
    gasFeeCap: '0',
    method: 0;
    params?: 'ghi'
  };
  return right( message );
};

export const typeCheckLotusMessage = (msg: any): asserts msg is LotusMessage => {
  if (!msg.to) throw new Error('No to address provided')
  if (!msg.from) throw new Error('No from address provided')

  if (!validateAddressString(msg.to))
    throw new Error('Invalid to address provided')
  if (!validateAddressString(msg.from))
    throw new Error('Invalid from address provided')

  if (!msg.nonce && msg.nonce !== 0) throw new Error('No nonce provided')
  if (typeof msg.nonce !== 'number') throw new Error('Nonce is not a number')
  if (!(msg.nonce <= Number.MAX_SAFE_INTEGER))
    throw new Error('Nonce must be smaller than Number.MAX_SAFE_INTEGER')

  if (!msg.value) throw new Error('No value provided')

  if (msg.gasLimit && typeof msg.gasLimit !== 'number')
    throw new Error('Gas limit is not a number')
  if (msg.gasLimit && !(msg.gasLimit <= Number.MAX_SAFE_INTEGER))
    throw new Error('Gas limit must be smaller than Number.MAX_SAFE_INTEGER')

  if (!msg.method && msg.method !== 0) throw new Error('No method provided')
  if (typeof msg.method !== 'number') throw new Error('Method is not a number')
  if (!(msg.method <= Number.MAX_SAFE_INTEGER))
    throw new Error('Method must be smaller than Number.MAX_SAFE_INTEGER')
}

/**
 * SignBytesMessage takes a Lotus Message, lower-cases the keys,
 * ipld-dag-cbor serializes it to obtain the CID bytes which are used for signing.
 */
export const signBytesMessage(message: LotusMessage): Uint8Array => {

}
