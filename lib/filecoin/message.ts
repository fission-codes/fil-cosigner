import BigNumber from 'bignumber.js';
import { Either, left, right } from "fp-ts/lib/Either";
import { validateAddressString } from '@glif/filecoin-address';
import lowercaseKeys from 'lowercase-keys';
// import { tryCatch } from 'fp-ts/lib/Option';
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
export const castToLotusMessage = (inputMessage: any): Either<InvalidLotusMessage, LotusMessage> => {
  const rawMessage = lowercaseKeys(inputMessage);

  // checks on to and from
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
  // checks on nonce
  if (!('nonce' in rawMessage) || typeof rawMessage.nonce !== 'number') {
    return left(new InvalidLotusMessage(
      "'nonce' is a required field and has to be a number"));
  }
  // checks on value
  if (!('value' in rawMessage) || typeof rawMessage.value !== 'string') {
    return left(new InvalidLotusMessage(
      "'value' is a required field and has to be a string"));
  }
  if (!isValidFilecoinDenomination(rawMessage.value)) {
    return left(new InvalidLotusMessage(
      'value must be a positive bignumber and less than maximum Filecoin issuance'));
  }
  // checks on gas limit
  if (!('gaslimit' in rawMessage) || typeof rawMessage.gaslimit !== 'number') {
    return left(new InvalidLotusMessage(
      'gaslimit is a required field and has to be a number'));
  }
  // checks on gas fee cap
  if (!('gasfeecap' in rawMessage) || typeof rawMessage.gasfeecap !== 'string') {
    return left(new InvalidLotusMessage(
      'gasfeecap is a required field and has to be a string'));
  }
  if (!isValidFilecoinDenomination(rawMessage.gasfeecap)) {
    return left(new InvalidLotusMessage(
      'gasfeecap must be a positive bignumber and less than maximum Filecoin issuance'));
  }
  // checks on gas premium
  if (!('gaspremium' in rawMessage) || typeof rawMessage.gaspremium !== 'string') {
    return left(new InvalidLotusMessage(
      'gaspremium is a required field and has to be a string'));
  }
  if (!isValidFilecoinDenomination(rawMessage.gaspremium)) {
    return left(new InvalidLotusMessage(
      'gaspremium must be a positive bignumber and less than maximum Filecoin issuance'));
  }
  // checks on method
  if (!('method' in rawMessage) || typeof rawMessage.method !== 'number') {
    return left(new InvalidLotusMessage('method is a required field and must be a number'));
  }
  // checks on params
  if (!('params' in rawMessage) || typeof rawMessage.params !== 'string') {
    return left(new InvalidLotusMessage('params is a required field and must be a string'));
  }


  const serializedMessage: LotusMessage = {
    to: 'abc',
    from: 'def',
    nonce: 0,
    value: '0',
    gasPremium: '0',
    gasLimit: 0,
    gasFeeCap: '0',
    method: 0,
    params?: 'ghi'
  };
  return right( serializedMessage );
};


/**
 * SignBytesMessage takes a Lotus Message, lower-cases the keys,
 * ipld-dag-cbor serializes it to obtain the CID bytes which are used for signing.
 */
export const signBytesMessage(message: LotusMessage): Uint8Array => {
  return
}

const isValidFilecoinDenomination(checkString: string): boolean => {
  const valueCheck = new BigNumber(checkString);
  if (valueCheck.isNaN() || !valueCheck.isPositive()) {
    return false;
  }
  // max issuance is 2.000.000.000 FIL with 18 decimal places
  const maxFilecoin = new BigNumber('2e27');
  if (valueCheck > maxFilecoin) {
    return false;
  }
  return true;
}

// const serializeBigInteger()
