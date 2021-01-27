// import * as filecoinMessage from '@glif/filecoin-message';

import BigNumber from 'bignumber.js';
import { validateAddressString } from '@glif/filecoin-address';

BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_HALF_DOWN });
BigNumber.config({ EXPONENTIAL_AT: 1e9 });

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
  sequenceNumber: number;
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
