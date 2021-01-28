import { validateAddressString } from '@glif/filecoin-address';

import { LotusMessage, Signature, SignedLotusMessage } from './message';
import { BlsPrivateKey } from '../bls-aggregation/aggregation';

/**
 * Cosigned Lotus Message explicitly specifies the address of the signer
 * which may differ from the `from` address field included in the message.
 * This is because for the final Lotus message to be broadcast, the from field
 * will specificy the aggregated public key of two public keys:
 * the users' public key and the cosigners' public key.
 * In order to obtain the aggregated signature, the cosigned message includes
 * the signature of a single party and it must be verified as such against
 * the signer field, not against the `from` field in the message.
 */
export interface CosignedLotusMessage extends LotusMessage, Signature {
  signer: string;
}

export const cosign = (msg: LotusMessage, secretKey: string): CosignedLotusMessage => {
  // CBOR serialise the message
  // get the CID
  // sign the CID with secretKey
  // return msg, signature, & publicKey of signer
}

export const aggregate = (
  msg1: CosignedLotusMessage,
  msg2: CosignedLotusMessage
  ): SignedLotusMessage => {

}


const typeCheck = (msg: any): asserts msg is LotusMessage => {
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
