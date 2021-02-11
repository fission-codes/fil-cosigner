import { castToLotusMessage, signingBytesLotusMessage, InvalidLotusMessage, LotusMessage } from './message';
import { BigNumber } from 'bignumber.js';
import { Either, isLeft, isRight, fold, getOrElseW } from "fp-ts/lib/Either";
import { pipe } from 'fp-ts/function';
import { readFileSync } from 'fs';
import { assert } from 'chai';

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

const baseLotusMessagObject = {
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

describe('constructing a Lotus Message', () => {
  describe('valid structures should cast', () => {
    it('should construct valid Lotus Message', () => {
      assert((isRight(castToLotusMessage(baseLotusMessagObject))),
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

describe('signing bytes of a Lotus Message', () => {
    // load test data
    const testVector = JSON.parse(
      readFileSync('./test-vectors/filecoin/getCid.json').toString());

    it('should marshal correct bytes', () => {
      assert(isRight(castToLotusMessage(testVector.signed_message.message)));
      // pipe(castToLotusMessage(testVector.signed_message.message)), fold(
      //   (error: InvalidLotusMessage): void => {
      //     assert(false, 'expected valid Lotus Message')
      //   },
      //   (lotusMessage: LotusMessage): void => {
      //     assert(false, 'what?');
      //     console.log(lotusMessage);
      //     const sbytes = signingBytesLotusMessage(lotusMessage);
      //   }
      // );
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