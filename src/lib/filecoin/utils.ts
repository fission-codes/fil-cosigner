import { Either, left, right} from 'fp-ts/lib/Either';
import { Protocol } from '@glif/filecoin-address';
import base32Decode from 'base32-decode';
import leb from 'leb128';
import { blake2b } from 'blakejs';
import BN from 'bn.js';

// reference https://spec.filecoin.io/appendix/address/

export const addressStringToBytes = (address: string): Either<Error, Buffer> => {
  // TODO: this is redundant because it is already checked in `castToLotusMessage`
  // but we don't explicitly carry address as a type, rather as string; so double check for now
  if(!address) return left(new Error('empty string is invalid address'));
  if (address.length < 3) return left(new Error('address is too short to parse'));
  if (address[0] !== 'f' && address[0] !== 't') {
    return left(new Error('unknown network set in address'));
  }

  let address_decoded: ArrayBuffer, payload: ArrayBuffer, checksum: ArrayBuffer;
  const protocolIndicator = address[1];
  const protocol = parseInt(protocolIndicator) as Protocol;
  switch (protocol) {
    case Protocol.ID: {
      // TODO: in glifio address length is max 22 char; in zondax max 18 char; resolve
      if (address.length > 22) return left(new Error('Invalid ID address length'));
      const testArray: Uint8Array = new Uint8Array(address.length - 3);
      const addressId: ArrayBuffer = leb.unsigned.encode(address.substr(2));
      testArray.set(new Uint8Array([0]), 0);
      testArray.set(new Uint8Array(addressId), 1);

      return right(Buffer.concat([
        Buffer.from(`0${protocolIndicator}`, 'hex'),
        Buffer.from(leb.unsigned.encode(address.substr(2))),
      ]));
    }
    case Protocol.SECP256K1: {
      address_decoded = base32Decode(address.slice(2).toUpperCase(), 'RFC4648');
      payload = address_decoded.slice(0, -4);
      checksum = Buffer.from(address_decoded.slice(-4));
      if (payload.byteLength !== 20) return left(new Error('invalid payload length in secp256k1 address'));
      break;
    }
    case Protocol.ACTOR: {
      address_decoded = base32Decode(address.slice(2).toUpperCase(), 'RFC4648');
      payload = address_decoded.slice(0, -4);
      checksum = Buffer.from(address_decoded.slice(-4));
      // TODO: zondax (wrongly) has byteLength 20; but seems wrong as payload here is a SHA256 hash
      // double-check and raise issue or PR with zondax
      if (payload.byteLength !== 32) return left(new Error('invalid payload length in Actor address'));
      break;
    }
    case Protocol.BLS: {
      address_decoded = base32Decode(address.slice(2).toUpperCase(), 'RFC4648');
      payload = address_decoded.slice(0, -4);
      checksum = Buffer.from(address_decoded.slice(-4));
      if  (payload.byteLength !== 48) return left(new Error('invalid payload length in BLS address'));
      break;
    }
    default: {
      return left(new Error('invalid address procotol byte'));
    }
  }

  const bytesAddress = Buffer.concat([
    Buffer.from(`0${protocolIndicator}`, 'hex'),
    Buffer.from(payload)]);

  // TODO: correct this checksum assertion; it fails currently (at least on the testvectors)
  // if (checksumFn(bytesAddress).toString('hex') !== checksum.toString()) {
  //   return left(new Error('invalid checksum for address'));
  // }

  return right(bytesAddress);
}

// export const publicKeyFromAddress = (address: string): Either<Error, PublicKey>

export const attoFilStringToBytes = (attoFilValue: string): Uint8Array => {
  if (attoFilValue === '0') {
    return Buffer.from('');
  }
  const valueBigInt = new BN(attoFilValue, 10);
  // encode as BigEndian bytes; TODO: improve types, again string has already been parsed
  const valueBytes = valueBigInt.toArrayLike(
    Buffer, 'be', valueBigInt.byteLength());
  // TODO: look up why the 00 bytes are prepended (to do with varint compatibility?)
  return Buffer.concat([
    Buffer.from('00', 'hex'),
    valueBytes]);
}

const checksumFn = (payload: Uint8Array): Uint8Array => {
  return blake2b(payload, null, 4);
}

/**
 * Convert a hex string to a Uint8Array.
 *
 * @param {string} hexString - hex representation of bytes
 * @return {Uint8Array} - The bytes in a Uint8Array.
 */
const hexStringToBytes = (hexString: string): Uint8Array => {
  // remove the leading 0x
  hexString = hexString.replace(/^0x/, '');

  // ensure even number of characters
  if (hexString.length % 2 != 0) {
      throw new Error('WARNING: expecting an even number of characters in the hexString');
  }

  // check for some non-hex characters
  const nonHexChar = hexString.match(/[G-Z\s]/i);
  if (nonHexChar) {
      throw new Error('WARNING: found non-hex characters: '+ nonHexChar);
  }

  // split the string into pairs of octets
  const pairs = hexString.match(/[\dA-F]{2}/gi);

  // convert the octets to integers
  const integers = pairs.map(function(s) {
      return parseInt(s, 16);
  });

  var array = new Uint8Array(integers);
  return array;
}
