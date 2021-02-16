import BigNumber from 'bignumber.js';
import { Either, left, right, isLeft } from "fp-ts/lib/Either";
import { validateAddressString } from '@glif/filecoin-address';
// import { encode } from '@glif/filecoin-address'
import * as cborDag from 'ipld-dag-cbor/src/util';
// TODO: this repo is working but static since 2018; readme refers to https://github.com/vrza/node-blake2
// examine if any value in switching over
import  * as blake from 'blakejs/blake2b.js';
import lowercaseKeys from 'lowercase-keys';
import { BlsSigningBytes } from '../crypto/bls12-381/operations';
import base32Encode from 'base32-encode';
import { addressStringToBytes, attoFilStringToBytes } from './utils';
// TODO: remove CID from package.json if still unused


// if attoFil strings have decimals, casting should fail either way, making this irrelevant for us
BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_HALF_DOWN });
// TODO: taken from glifio, but is this relevant? will comment out, remove later
// BigNumber.config({ EXPONENTIAL_AT: 1e9 });

const messageVersion = 0;
// TODO: check prefix origin and correctness; taken from
// https://github.com/zondax/filecoin-signing-tools/blob/76d6aa81f697566a976a68c2e30803bf2d4bd397/examples/wasm_node/test/utils.js
const cidPrefix = Buffer.from([0x01, 0x71, 0xa0, 0xe4, 0x02, 0x20]);
export const secpSignatureType = 0;
export const blsSignatureType = 1;

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
  // support version 0 only
  version: number;
  // filecoin address as destination of message
  to: string;
  // filecoin address from which message is sent
  from: string;
  // strict increasing uint64 for each sequential number (TODO: starting with 1?)
  nonce: number;
  // value in attoFil big integer as string
  value: string;
  // gas premium in attoFil big integer as string
  gasPremium: string;
  // gas limit in gas as uint64
  gasLimit: number;
  // gas fee cap in attoFil big integer as string
  gasFeeCap: string;
  // method number as uint64 indication function on actor associated with to address
  method: number;
  // params for function call as bytes
  params: string;
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
  signatureType: number; // 0 for secp; 1 for bls;
  signatureBytes: Uint8Array; // bytes, map to "data" as string for Filecoin
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

  // checks on version number
  if (!('version' in rawMessage) || typeof rawMessage.version !== 'number') {
    return left(new InvalidLotusMessage(
      'version is a required field and has to be a number'));
  }
  if (rawMessage.version !== messageVersion) {
    return left(new InvalidLotusMessage('version number is not supported'));
  }
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

  // TODO: check addresses to and from are on the same network

  const lotusMessage: LotusMessage = {
    version: rawMessage.version,
    to: rawMessage.to,
    from: rawMessage.from,
    nonce: rawMessage.nonce,
    value: rawMessage.value,
    gasLimit: rawMessage.gaslimit,
    gasFeeCap: rawMessage.gasfeecap,
    gasPremium: rawMessage.gaspremium,
    method: rawMessage.method,
    params: rawMessage.params
  };
  return right( lotusMessage );
}

/**
 * SigningBytesLotusMessage takes a Lotus Message, lower-cases the keys,
 * ipld-dag-cbor serializes it to obtain the digest of the CID bytes
 * which are used for signing.
 */
export const signingBytesLotusMessage =
  (message: LotusMessage): Either<Error, BlsSigningBytes> => {
  const Key = null; // optional key, leave null
  const OutputLength = 32; // output length in bytes

  const eitherCborEncodedLotusMessage = serializeLotusMessage(message);
  if (isLeft(eitherCborEncodedLotusMessage)) return eitherCborEncodedLotusMessage;
  const cborEncodedLotusMessage = eitherCborEncodedLotusMessage.right;

  const blakeCidCtx = blake.blake2bInit(OutputLength, Key);
  // get CID of message by hashing cbor serialisation with blake2b 256bits
  blake.blake2bUpdate(blakeCidCtx, cborEncodedLotusMessage);
  const hashDigest = blake.blake2bFinal(blakeCidCtx);
  const messageCid = Buffer.concat([cidPrefix, hashDigest]);

  // console.log('cid ' + base32Encode(messageCid, "RFC4648", { padding: false }).toLowerCase());

  const blakeDigestCtx = blake.blake2bInit(OutputLength, Key);
  // signing bytes are the blake2b256 hash digest of the message CID
  blake.blake2bUpdate(blakeDigestCtx, messageCid);
  return right(blake.blake2bFinal(blakeDigestCtx));
}

export const serializeLotusMessage = (lotusMessage: LotusMessage): Either<Error, string> => {

  const toEitherBytes = addressStringToBytes(lotusMessage.to);
  if (isLeft(toEitherBytes)) return toEitherBytes;
  const toBytes: Buffer = toEitherBytes.right;

  const fromEitherBytes = addressStringToBytes(lotusMessage.from);
  if (isLeft(fromEitherBytes)) return fromEitherBytes;
  const fromBytes: Buffer = fromEitherBytes.right;

  const valueBytes = attoFilStringToBytes(lotusMessage.value);
  const gasFeeCapBytes = attoFilStringToBytes(lotusMessage.gasFeeCap);
  const gasPremiumBytes = attoFilStringToBytes(lotusMessage.gasPremium);

  const messageToSerialize = [
    lotusMessage.version,
    toBytes,
    fromBytes,
    lotusMessage.nonce,
    valueBytes,
    lotusMessage.gasLimit,
    gasFeeCapBytes,
    gasPremiumBytes,
    lotusMessage.method,
    Buffer.from("", 'base64')
  ]

  return right(Buffer.from(
    cborDag.serialize(messageToSerialize)).toString('hex'));
}

const isValidFilecoinDenomination = (checkString: string): boolean => {
  const valueCheck = new BigNumber(checkString);
  if (valueCheck.isNaN() || !valueCheck.isPositive()) {
    return false;
  }
  // assert the string did not have exponential notation
  if (!(valueCheck.toFixed(0, 1) === checkString)) {
    return false;
  }
  // max issuance is 2.000.000.000 FIL with 18 decimal places
  const maxFilecoin = new BigNumber('2e27');
  if (valueCheck > maxFilecoin) {
    return false;
  }
  return true;
}
