//
// This file is subject to the terms and conditions defined in
// file 'LICENSE', which is part of this source code package.
//

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { default as usingApi } from './substrate/substrate-api';
import { BigNumber } from 'bignumber.js';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('integration test: Inflation', () => {
  it('First year inflation is 10%', async () => {
    await usingApi(async (api) => {

      const blockInterval = parseInt((await api.consts.inflation.inflationBlockInterval).toString());
      const totalIssuanceStart = new BigNumber((await api.query.inflation.startingYearTotalIssuance()).toString());
      const blockInflation = new BigNumber((await api.query.inflation.blockInflation()).toString());

      const YEAR = 5259600; // Blocks in one year
      const totalExpectedInflation = totalIssuanceStart.multipliedBy(0.1);
      const totalActualInflation = blockInflation.multipliedBy(YEAR / blockInterval);

      const tolerance = 0.00001; // Relative difference per year between theoretical and actual inflation
      expect(totalExpectedInflation.dividedBy(totalActualInflation).minus(1).abs().toNumber()).to.be.lessThan(tolerance);
    });
  });

});
