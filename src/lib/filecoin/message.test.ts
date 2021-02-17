import {
  castToLotusMessage,
  messageDigestLotusMessage,
  serializeLotusMessage,
  InvalidLotusMessage,
  LotusMessage,
  MessageDigestBytes } from './message';
import { BigNumber } from 'bignumber.js';
import { Either, isLeft, isRight, fold, getOrElseW } from "fp-ts/lib/Either";
import { pipe } from 'fp-ts/function';
import { readFileSync } from 'fs';
import { assert } from 'chai';

// load test data
const incompleteBaseLotusMessagObject = {
  // version: 0,
  to: 't03832874859695014541',
  from: 't1pyfq7dg6sq65acyomqvzvbgwni4zllglqffw5dy',
  nonce: 10,
  value: '11416382733294334924',
  method: 0,
  gasFeeCap: '1',
  gasPremium: '1',
  gasLimit: 123,
  params: ''
}

const testVectorMessages = JSON.parse(
  readFileSync('./test-vectors/filecoin/messages.json').toString());

describe('constructing a Lotus Message', () => {
  describe('valid structures should cast', () => {
    it('should construct valid Lotus Message', () => {
      assert((isRight(castToLotusMessage(testVectorMessages[0].message))),
        'expected valid Lotus Message');
    });
  });

  describe('invalid structures should fail', () => {
    it('should fail if version is not 0', () => {
      assertInvalidLotusMessage(
        'version is a required field and has to be a number',
        castToLotusMessage(incompleteBaseLotusMessagObject));
    });
  });
});

describe('serialize a Lotus Message', () => {

  it('should serialize a Lotus Message', () => {
    pipe(castToLotusMessage(testVectorMessages[0].message), fold(
      (_error: InvalidLotusMessage): void => {
        assert(false, 'expected valid Lotus Message');
      },
      (lotusMessage: LotusMessage): void => {
        pipe(serializeLotusMessage(lotusMessage), fold(
          (e: Error): void => {
            assert(false, 'expected serialization');
          },
          (serialised: string): void => {
            assert(serialised === testVectorMessages[0].cbor, 'failed to match serialisation');
          }));
      }));
  });
});


describe('message digest of a Lotus Message', () => {

  it('should marshal and return correct digest', () => {
    pipe(castToLotusMessage(testVectorMessages[1].message), fold(
      (_error: InvalidLotusMessage): void => {
        assert(false, 'expected valid Lotus Message');
      },
      (lotusMessage: LotusMessage): void => {
        pipe(messageDigestLotusMessage(lotusMessage), fold(
          (e: Error): void => {
            assert(false, 'expected digest');
          },
          (digest: MessageDigestBytes): void => {
            assert(
              (Buffer.from(digest)).toString('hex') === testVectorMessages[1].digest,
              'failed to match digest');
          }
        ));
      }
    ));
  });
});

const assertInvalidLotusMessage = (
  expectedError: string,
  result: Either<InvalidLotusMessage, LotusMessage>
): void => {
  pipe(result, fold(
    (invalidMessage: InvalidLotusMessage): void => {
      assert(
        (expectedError === invalidMessage.message),
        'Invalid Lotus Message error does not match. Received: ' +
          invalidMessage.message + '; expected: ' +
          expectedError);
    },
    (_lotusMessage: LotusMessage): void => {
      assert(false, 'Got a valid Lotus Message, expected invalid message error.');
    }));
}
