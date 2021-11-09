//
// This file is subject to the terms and conditions defined in
// file 'LICENSE', which is part of this source code package.
//

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import usingApi, {submitTransactionAsync, submitTransactionExpectFailAsync} from './substrate/substrate-api';
import privateKey from './substrate/privateKey';
import {
  deployFlipper,
  getFlipValue,
} from './util/contracthelpers';
import {
  getGenericResult,
} from './util/helpers';

chai.use(chaiAsPromised);
const expect = chai.expect;

const value = 0;
const gasLimit = 3000n * 1000000n;

describe.skip('Integration Test toggleContractAllowList', () => {

  it('Enable allow list contract mode', async () => {
    await usingApi(async api => {
      const [contract, deployer] = await deployFlipper(api);

      const enabledBefore = (await api.query.nft.contractAllowListEnabled(contract.address)).toJSON();
      const enableAllowListTx = api.tx.nft.toggleContractAllowList(contract.address, true);
      const enableEvents = await submitTransactionAsync(deployer, enableAllowListTx);
      const enabled = (await api.query.nft.contractAllowListEnabled(contract.address)).toJSON();

      expect(getGenericResult(enableEvents).success).to.be.true;
      expect(enabledBefore).to.be.false;
      expect(enabled).to.be.true;
    });
  });

  it('Only allowlisted account can call contract', async () => {
    await usingApi(async api => {
      const bob = privateKey('//Bob');

      const [contract, deployer] = await deployFlipper(api);

      let flipValueBefore = await getFlipValue(contract, deployer);
      const flip = contract.tx.flip(value, gasLimit);
      await submitTransactionAsync(bob, flip);
      const flipValueAfter = await getFlipValue(contract,deployer);
      expect(flipValueAfter).to.be.eq(!flipValueBefore, 'Anyone can call new contract.');

      const deployerCanFlip = async () => {
        const flipValueBefore = await getFlipValue(contract, deployer);
        const deployerFlip = contract.tx.flip(value, gasLimit);
        await submitTransactionAsync(deployer, deployerFlip);
        const aliceFlip1Response = await getFlipValue(contract, deployer);
        expect(aliceFlip1Response).to.be.eq(!flipValueBefore, 'Deployer always can flip.');
      };
      await deployerCanFlip();

      flipValueBefore = await getFlipValue(contract, deployer);
      const enableAllowListTx = api.tx.nft.toggleContractAllowList(contract.address, true);
      await submitTransactionAsync(deployer, enableAllowListTx);
      const flipWithEnabledAllowList = contract.tx.flip(value, gasLimit);
      await expect(submitTransactionExpectFailAsync(bob, flipWithEnabledAllowList)).to.be.rejected;
      const flipValueAfterEnableAllowList = await getFlipValue(contract, deployer);
      expect(flipValueAfterEnableAllowList).to.be.eq(flipValueBefore, 'Enabling allowlist doesn\'t make it possible to call contract for everyone.');

      await deployerCanFlip();

      flipValueBefore = await getFlipValue(contract, deployer);
      const addBobToAllowListTx = api.tx.nft.addToContractAllowList(contract.address, bob.address);
      await submitTransactionAsync(deployer, addBobToAllowListTx);
      const flipWithAllowlistedBob = contract.tx.flip(value, gasLimit);
      await submitTransactionAsync(bob, flipWithAllowlistedBob);
      const flipAfterAllowListed = await getFlipValue(contract,deployer);
      expect(flipAfterAllowListed).to.be.eq(!flipValueBefore, 'Bob was allowlisted, now he can flip.');

      await deployerCanFlip();

      flipValueBefore = await getFlipValue(contract, deployer);
      const removeBobFromAllowListTx = api.tx.nft.removeFromContractAllowList(contract.address, bob.address);
      await submitTransactionAsync(deployer, removeBobFromAllowListTx);
      const bobRemoved = contract.tx.flip(value, gasLimit);
      await expect(submitTransactionExpectFailAsync(bob, bobRemoved)).to.be.rejected;
      const afterBobRemoved = await getFlipValue(contract, deployer);
      expect(afterBobRemoved).to.be.eq(flipValueBefore, 'Bob can\'t call contract, now when he is removeed from allow list.');

      await deployerCanFlip();

      flipValueBefore = await getFlipValue(contract, deployer);
      const disableAllowListTx = api.tx.nft.toggleContractAllowList(contract.address, false);
      await submitTransactionAsync(deployer, disableAllowListTx);
      const allowListDisabledFlip = contract.tx.flip(value, gasLimit);
      await submitTransactionAsync(bob, allowListDisabledFlip);
      const afterAllowListDisabled = await getFlipValue(contract,deployer);
      expect(afterAllowListDisabled).to.be.eq(!flipValueBefore, 'Anyone can call contract with disabled allowlist.');

    });
  });

  it('Enabling allow list repeatedly should not produce errors', async () => {
    await usingApi(async api => {
      const [contract, deployer] = await deployFlipper(api);

      const enabledBefore = (await api.query.nft.contractAllowListEnabled(contract.address)).toJSON();
      const enableAllowListTx = api.tx.nft.toggleContractAllowList(contract.address, true);
      const enableEvents = await submitTransactionAsync(deployer, enableAllowListTx);
      const enabled = (await api.query.nft.contractAllowListEnabled(contract.address)).toJSON();
      const enableAgainEvents = await submitTransactionAsync(deployer, enableAllowListTx);
      const enabledAgain = (await api.query.nft.contractAllowListEnabled(contract.address)).toJSON();

      expect(getGenericResult(enableEvents).success).to.be.true;
      expect(enabledBefore).to.be.false;
      expect(enabled).to.be.true;
      expect(getGenericResult(enableAgainEvents).success).to.be.true;
      expect(enabledAgain).to.be.true;
    });
  });

});

describe.skip('Negative Integration Test toggleContractAllowList', () => {

  it('Enable allow list for a non-contract', async () => {
    await usingApi(async api => {
      const alice = privateKey('//Alice');
      const bobGuineaPig = privateKey('//Bob');

      const enabledBefore = (await api.query.nft.contractAllowListEnabled(bobGuineaPig.address)).toJSON();
      const enableAllowListTx = api.tx.nft.toggleContractAllowList(bobGuineaPig.address, true);
      await expect(submitTransactionExpectFailAsync(alice, enableAllowListTx)).to.be.rejected;
      const enabled = (await api.query.nft.contractAllowListEnabled(bobGuineaPig.address)).toJSON();

      expect(enabledBefore).to.be.false;
      expect(enabled).to.be.false;
    });
  });

  it('Enable allow list using a non-owner address', async () => {
    await usingApi(async api => {
      const bob = privateKey('//Bob');
      const [contract] = await deployFlipper(api);

      const enabledBefore = (await api.query.nft.contractAllowListEnabled(contract.address)).toJSON();
      const enableAllowListTx = api.tx.nft.toggleContractAllowList(contract.address, true);
      await expect(submitTransactionExpectFailAsync(bob, enableAllowListTx)).to.be.rejected;
      const enabled = (await api.query.nft.contractAllowListEnabled(contract.address)).toJSON();

      expect(enabledBefore).to.be.false;
      expect(enabled).to.be.false;
    });
  });

});