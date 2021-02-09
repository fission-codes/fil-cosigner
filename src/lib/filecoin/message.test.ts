import { castToLotusMessage, LotusMessage } from './message';
import { BigNumber } from 'bignumber.js';
import { isLeft, isRight } from "fp-ts/lib/Either";
import { expect } from 'chai';

const baseLotusObject = {
  to: 't03832874859695014541',
  from: 't1pyfq7dg6sq65acyomqvzvbgwni4zllglqffw5dy',
  nonce: 10,
  value: new BigNumber('11416382733294334924'),
  method: 0
}

describe('Lotus Message', () => {
  describe('validate struct into Lotus Message', () => {
    it('it should construct valid Lotus Message', () => {
      expect(isLeft(castToLotusMessage(baseLotusObject)));
    });
  });
});
