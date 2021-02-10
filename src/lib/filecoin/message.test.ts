import { castToLotusMessage, InvalidLotusMessage, LotusMessage } from './message';
import { BigNumber } from 'bignumber.js';
import { Either, isLeft, isRight, fold } from "fp-ts/lib/Either";
import { constFalse, pipe } from 'fp-ts/function';
import { assert } from 'chai';
import P from 'pino';

const incompleteBaseLotusObj = {
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

const baseLotusObject = {
  version: 0,
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
    it('it should construct valid Lotus Message', () => {
      assert((isRight(castToLotusMessage(baseLotusObject))),
        'expected valid Lotus Message');
    });
  });

  describe('invalid structures should fail', () => {
    it('should fail if version is not 0', () => {
      assertInvalidLotusMessage(
        'version is a required field and has to be a number',
        castToLotusMessage(incompleteBaseLotusObj));
    });
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
