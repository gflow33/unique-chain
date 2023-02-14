// Copyright 2019-2022 Unique Network (Gibraltar) Ltd.
// This file is part of Unique Network.

// Unique Network is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Unique Network is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Unique Network. If not, see <http://www.gnu.org/licenses/>.

import {IKeyringPair} from '@polkadot/types/types';
import {
  itSub, usingPlaygrounds, Pallets, requirePalletsOrSkip, LOCKING_PERIOD, UNLOCKING_PERIOD,
} from '../../util';
import {DevUniqueHelper} from '../../util/playgrounds/unique.dev';
import {itEth, expect, SponsoringMode} from '../../eth/util';

let donor: IKeyringPair;
let palletAdmin: IKeyringPair;
let nominal: bigint;
let palletAddress: string;
let accounts: IKeyringPair[];
// App promotion periods:
// LOCKING_PERIOD = 12 blocks of relay
// UNLOCKING_PERIOD = 6 blocks of parachain

describe('App promotion', () => {
  before(async function () {
    await usingPlaygrounds(async (helper, privateKey) => {
      requirePalletsOrSkip(this, helper, [Pallets.AppPromotion]);
      donor = await privateKey({filename: __filename});
      palletAddress = helper.arrange.calculatePalletAddress('appstake');
      palletAdmin = await privateKey('//PromotionAdmin');
      nominal = helper.balance.getOneTokenNominal();

      const accountBalances = new Array(100);
      accountBalances.fill(1000n);
      accounts = await helper.arrange.createAccounts(accountBalances, donor); // create accounts-pool to speed up tests
    });
  });

  describe('stake extrinsic', () => {
    itSub('should "lock" staking balance, add it to "staked" map, and increase "totalStaked" amount', async ({helper}) => {
      const [staker, recepient] = [accounts.pop()!, accounts.pop()!];
      const totalStakedBefore = await helper.staking.getTotalStaked();

      // Minimum stake amount is 100:
      await expect(helper.staking.stake(staker, 100n * nominal - 1n)).to.be.rejected;
      await helper.staking.stake(staker, 100n * nominal);

      // Staker balance is: miscFrozen: 100, feeFrozen: 100, reserved: 0n...
      // ...so he can not transfer 900
      expect(await helper.balance.getSubstrateFull(staker.address)).to.contain({miscFrozen: 100n * nominal, feeFrozen: 100n * nominal, reserved: 0n});
      expect(await helper.balance.getLocked(staker.address)).to.deep.eq([{id: 'appstake', amount: 100n * nominal, reasons: 'All'}]);
      await expect(helper.balance.transferToSubstrate(staker, recepient.address, 900n * nominal)).to.be.rejectedWith('balances.LiquidityRestrictions');

      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.be.equal(100n * nominal);
      expect(await helper.balance.getSubstrate(staker.address) / nominal).to.be.equal(999n);
      // it is potentially flaky test. Promotion can credited some tokens. Maybe we need to use closeTo?
      expect(await helper.staking.getTotalStaked()).to.be.equal(totalStakedBefore + 100n * nominal); // total tokens amount staked in app-promotion increased


      await helper.staking.stake(staker, 200n * nominal);
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.be.equal(300n * nominal);
      const totalStakedPerBlock = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      expect(totalStakedPerBlock[0].amount).to.equal(100n * nominal);
      expect(totalStakedPerBlock[1].amount).to.equal(200n * nominal);
    });

    [
      {unstake: 'unstakeAll' as const},
      {unstake: 'unstakePartial' as const},
    ].map(testCase => {
      itSub('should allow to create maximum 10 stakes for account', async ({helper}) => {
        const [staker] = await helper.arrange.createAccounts([2000n], donor);
        const ONE_STAKE = 100n * nominal;
        for (let i = 0; i < 10; i++) {
          await helper.staking.stake(staker, ONE_STAKE);
        }

        // can have 10 stakes
        expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.be.equal(1000n * nominal);
        expect(await helper.staking.getTotalStakedPerBlock({Substrate: staker.address})).to.have.length(10);

        await expect(helper.staking.stake(staker, ONE_STAKE)).to.be.rejectedWith('appPromotion.NoPermission');

        // After unstake can stake again

        // CASE 1: unstakeAll
        if (testCase.unstake === 'unstakeAll') {
          await helper.staking.unstakeAll(staker);
          expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(0);
          await helper.staking.stake(staker, 100n * nominal);
          expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.equal(100n * nominal);
        }
        // CASE 2: unstakePartial
        else {
          await helper.staking.unstakePartial(staker, ONE_STAKE);
          expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(9);
          await helper.staking.stake(staker, 100n * nominal);
          expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(10);
          await expect(helper.staking.stake(staker, 100n * nominal)).to.be.rejectedWith('appPromotion.NoPermission');
          await helper.staking.unstakePartial(staker, 150n * nominal);
          expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(9);
          expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.equal(850n * nominal);
        }
      });
    });

    itSub('should allow to stake() if balance is locked with different id', async ({helper}) => {
      const staker = accounts.pop()!;

      // staker has tokens locked with vesting id:
      await helper.balance.vestedTransfer(donor, staker.address, {start: 0n, period: 1n, periodCount: 1n, perPeriod: 200n * nominal});
      expect(await helper.balance.getSubstrateFull(staker.address))
        .to.deep.contain({free: 1200n * nominal, miscFrozen: 200n * nominal, feeFrozen: 200n * nominal, reserved: 0n});

      // Locked balance can be staked. staker can stake 1200 tokens (minus fee):
      await helper.staking.stake(staker, 1000n * nominal);
      await helper.staking.stake(staker, 199n * nominal);
      // check balances
      expect(await helper.balance.getLocked(staker.address)).to.deep.eq([{id: 'ormlvest', amount: 200n * nominal, reasons: 'All'}, {id: 'appstake', amount: 1199n * nominal, reasons: 'All'}]);
      expect(await helper.balance.getSubstrateFull(staker.address)).to.deep.contain({reserved: 0n, miscFrozen: 1199n * nominal, feeFrozen: 1199n * nominal});
      expect(await helper.balance.getSubstrate(staker.address) / nominal).to.eq(1199n);
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.eq(1199n * nominal);

      // staker can unstake
      await helper.staking.unstakeAll(staker);
      expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.eq(1199n * nominal);
      const [pendingUnstake] = await helper.staking.getPendingUnstakePerBlock({Substrate: staker.address});
      await helper.wait.forParachainBlockNumber(pendingUnstake.block);

      // check balances
      expect(await helper.balance.getLocked(staker.address)).to.deep.eq([{id: 'ormlvest', amount: 200n * nominal, reasons: 'All'}]);
      expect(await helper.balance.getSubstrateFull(staker.address)).to.deep.contain({reserved: 0n, miscFrozen: 200n * nominal, feeFrozen: 200n * nominal});
      expect(await helper.balance.getSubstrate(staker.address) / nominal).to.eq(1199n);
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.eq(0n);

      // staker can transfer balances now
      await helper.balance.transferToSubstrate(staker, donor.address, 900n * nominal);
    });

    itSub('should not allow to stake(), if stake amount is more than total free balance minus locked by staking', async ({helper}) => {
      const staker = accounts.pop()!;

      // Can't stake full balance because Alice needs to pay some fee
      await expect(helper.staking.stake(staker, 1000n * nominal)).to.be.rejected; // With('Arithmetic')
      await helper.staking.stake(staker, 500n * nominal);

      // Can't stake 500 tkn because Alice has Less than 500 transferable;
      await expect(helper.staking.stake(staker, 500n * nominal)).to.be.rejected; // With('Arithmetic');
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.be.equal(500n * nominal);
    });

    itSub('for different accounts in one block is possible', async ({helper}) => {
      const crowd = [accounts.pop()!, accounts.pop()!, accounts.pop()!, accounts.pop()!];

      const crowdStartsToStake = crowd.map(user => helper.staking.stake(user, 100n * nominal));
      await expect(Promise.all(crowdStartsToStake)).to.be.fulfilled;

      const crowdStakes = await Promise.all(crowd.map(address => helper.staking.getTotalStaked({Substrate: address.address})));
      expect(crowdStakes).to.deep.equal([100n * nominal, 100n * nominal, 100n * nominal, 100n * nominal]);
    });
  });

  describe('Unstaking', () => {
    [
      {method: 'unstakeAll' as const},
      {method: 'unstakePartial' as const},
    ].map(testCase => {
      itSub(`[${testCase.method}] should move tokens to "pendingUnstake" and subtract it from totalStaked`, async ({helper}) => {
        const [staker, recepient] = [accounts.pop()!, accounts.pop()!];
        const totalStakedBefore = await helper.staking.getTotalStaked();
        const STAKE_AMOUNT = 900n * nominal;

        await helper.staking.stake(staker, STAKE_AMOUNT);
        testCase.method === 'unstakeAll'
          ? await helper.staking.unstakeAll(staker)
          : await helper.staking.unstakePartial(staker, STAKE_AMOUNT);

        // Right after unstake tokens are still locked
        expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(0);
        expect(await helper.balance.getLocked(staker.address)).to.deep.eq([{id: 'appstake', amount: STAKE_AMOUNT, reasons: 'All'}]);
        expect(await helper.balance.getSubstrateFull(staker.address)).to.deep.contain({reserved: 0n, miscFrozen: STAKE_AMOUNT, feeFrozen: STAKE_AMOUNT});
        // Staker can not transfer
        await expect(helper.balance.transferToSubstrate(staker, recepient.address, 100n * nominal)).to.be.rejectedWith('balances.LiquidityRestrictions');
        expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.be.equal(STAKE_AMOUNT);
        expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.be.equal(0n);
        expect(await helper.staking.getTotalStaked()).to.be.equal(totalStakedBefore);
      });
    });

    [
      {method: 'unstakeAll' as const},
      {method: 'unstakePartial' as const},
    ].map(testCase => {
      itSub(`[${testCase.method}] should unlock balance after unlocking period ends and remove it from "pendingUnstake"`, async ({helper}) => {
        const staker = accounts.pop()!;
        await helper.staking.stake(staker, 100n * nominal);
        testCase.method === 'unstakeAll'
          ? await helper.staking.unstakeAll(staker)
          : await helper.staking.unstakePartial(staker, 100n * nominal);
        const [pendingUnstake] = await helper.staking.getPendingUnstakePerBlock({Substrate: staker.address});

        // Wait for unstaking period. Balance now free ~1000; reserved, frozen, miscFrozeb: 0n
        await helper.wait.forParachainBlockNumber(pendingUnstake.block);
        expect(await helper.balance.getSubstrateFull(staker.address)).to.deep.contain({reserved: 0n, miscFrozen: 0n, feeFrozen: 0n});
        expect(await helper.balance.getSubstrate(staker.address) / nominal).to.be.equal(999n);

        // staker can transfer:
        await helper.balance.transferToSubstrate(staker, donor.address, 998n * nominal);
        expect(await helper.balance.getSubstrate(staker.address) / nominal).to.be.equal(1n);
      });
    });

    [
      {method: 'unstakeAll' as const},
      {method: 'unstakePartial' as const},
    ].map(testCase => {
      itSub(`[${testCase.method}] should successfully unstake multiple stakes`, async ({helper}) => {
        const staker = accounts.pop()!;
        await helper.staking.stake(staker, 100n * nominal);
        await helper.staking.stake(staker, 200n * nominal);
        await helper.staking.stake(staker, 300n * nominal);

        // staked: [100, 200, 300]; unstaked: 0
        let totalPendingUnstake = await helper.staking.getPendingUnstake({Substrate: staker.address});
        let pendingUnstake = await helper.staking.getPendingUnstakePerBlock({Substrate: staker.address});
        let stakes = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
        expect(totalPendingUnstake).to.be.deep.equal(0n);
        expect(pendingUnstake).to.be.deep.equal([]);
        expect(stakes[0].amount).to.equal(100n * nominal);
        expect(stakes[1].amount).to.equal(200n * nominal);
        expect(stakes[2].amount).to.equal(300n * nominal);

        // Can unstake multiple stakes
        testCase.method === 'unstakeAll'
          ? await helper.staking.unstakeAll(staker)
          : await helper.staking.unstakePartial(staker, 600n * nominal);

        pendingUnstake = await helper.staking.getPendingUnstakePerBlock({Substrate: staker.address});
        totalPendingUnstake = await helper.staking.getPendingUnstake({Substrate: staker.address});
        stakes = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
        expect(totalPendingUnstake).to.be.equal(600n * nominal);
        expect(stakes).to.be.deep.equal([]);
        expect(pendingUnstake[0].amount).to.equal(600n * nominal);

        expect (await helper.balance.getSubstrateFull(staker.address)).to.deep.contain({reserved: 0n, feeFrozen: 600n * nominal, miscFrozen: 600n * nominal});
        expect (await helper.balance.getSubstrate(staker.address) / nominal).to.be.equal(999n);
        await helper.wait.forParachainBlockNumber(pendingUnstake[0].block);
        expect (await helper.balance.getSubstrateFull(staker.address)).to.deep.contain({reserved: 0n, feeFrozen: 0n, miscFrozen: 0n});
        expect (await helper.balance.getSubstrate(staker.address) / nominal).to.be.equal(999n);
      });
    });

    [
      {method: 'unstakeAll' as const},
      {method: 'unstakePartial' as const},
    ].map(testCase => {
      itSub(`[${testCase.method}] should not have any effects if no active stakes`, async ({helper}) => {
        const staker = accounts.pop()!;

        // unstake has no effect if no stakes at all
        testCase.method === 'unstakeAll'
          ? await helper.staking.unstakeAll(staker)
          : await expect(helper.staking.unstakePartial(staker, 100n * nominal)).to.be.rejectedWith('appPromotion.InsufficientStakedBalance');

        expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.be.equal(0n);
        expect(await helper.balance.getSubstrate(staker.address) / nominal).to.be.equal(999n); // TODO bigint closeTo helper

        // TODO stake() unstake() waitUnstaked() unstake();

        // can't unstake if there are only pendingUnstakes
        await helper.staking.stake(staker, 100n * nominal);

        if (testCase.method === 'unstakeAll') {
          await helper.staking.unstakeAll(staker);
          await helper.staking.unstakeAll(staker);
        } else {
          await helper.staking.unstakePartial(staker, 100n * nominal);
          await expect(helper.staking.unstakePartial(staker, 100n * nominal)).to.be.rejectedWith('appPromotion.InsufficientStakedBalance');
        }

        expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(0);
        expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.be.equal(100n * nominal);
        expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.be.equal(0n);
      });
    });

    [
      {method: 'unstakeAll' as const},
      {method: 'unstakePartial' as const},
    ].map(testCase => {
      itSub(`[${testCase.method}] should create different pending-unlock for each unlocking stake`, async ({helper}) => {
        const staker = accounts.pop()!;
        await helper.staking.stake(staker, 100n * nominal);
        testCase.method === 'unstakeAll'
          ? await helper.staking.unstakeAll(staker)
          : await helper.staking.unstakePartial(staker, 100n * nominal);
        await helper.staking.stake(staker, 120n * nominal);
        testCase.method === 'unstakeAll'
          ? await helper.staking.unstakeAll(staker)
          : await helper.staking.unstakePartial(staker, 120n * nominal);

        const unstakingPerBlock = await helper.staking.getPendingUnstakePerBlock({Substrate: staker.address});
        expect(unstakingPerBlock).has.length(2);
        expect(unstakingPerBlock[0].amount).to.equal(100n * nominal);
        expect(unstakingPerBlock[1].amount).to.equal(120n * nominal);
        expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.equal(0);
      });
    });

    [
      {method: 'unstakeAll' as const},
      {method: 'unstakePartial' as const},
    ].map(testCase => {
      itSub(`[${testCase.method}] should be possible for 3 accounts in one block`, async ({helper}) => {
        const stakers = [accounts.pop()!, accounts.pop()!, accounts.pop()!];

        await Promise.all(stakers.map(staker => helper.staking.stake(staker, 100n * nominal)));
        await Promise.all(stakers.map(staker => {
          return testCase.method === 'unstakeAll'
            ? helper.staking.unstakeAll(staker)
            : helper.staking.unstakePartial(staker, 100n * nominal);
        }));

        await Promise.all(stakers.map(async (staker) => {
          expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.be.equal(100n * nominal);
          expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.be.equal(0n);
        }));
      });
    });

    itSub('should not be possible for more than 3 accounts in one block', async ({helper}) => {
      if (!await helper.arrange.isDevNode()) {
        const stakers = await helper.arrange.createAccounts([200n,200n,200n,200n,200n,200n,200n,200n,200n,200n], donor);

        await Promise.all(stakers.map(staker => helper.staking.stake(staker, 100n * nominal)));
        const unstakingResults = await Promise.allSettled(stakers.map((staker, i) => {
          return i % 2 === 0
            ? helper.staking.unstakeAll(staker)
            : helper.staking.unstakePartial(staker, 100n * nominal);
        }));

        const successfulUnstakes = unstakingResults.filter(result => result.status === 'fulfilled');
        expect(successfulUnstakes).to.have.length(3);
      }
    });

    itSub('Cannot partially unstake more than staked', async ({helper}) => {
      const staker = accounts.pop()!;
      // Staker stakes 300:
      await helper.staking.stake(staker, 100n * nominal);
      await helper.staking.stake(staker, 200n * nominal);

      // cannot usntake 300.00000...1
      await expect(helper.staking.unstakePartial(staker, 300n * nominal + 1n)).to.be.rejectedWith('Arithmetic: Underflow');
      expect(await helper.staking.getStakesNumber({Substrate: staker.address})).eq(2);

      await helper.staking.unstakePartial(staker, 150n * nominal);
      expect(await helper.staking.getStakesNumber({Substrate: staker.address})).eq(1);
      await expect(helper.staking.unstakePartial(staker, 150n * nominal + 1n)).to.be.rejectedWith('Arithmetic: Underflow');
      expect(await helper.staking.getStakesNumber({Substrate: staker.address})).eq(1);

      // nothing broken, can unstake full amount:
      await helper.staking.unstakePartial(staker, 150n * nominal);
      expect(await helper.staking.getStakesNumber({Substrate: staker.address})).eq(0);
    });

    itSub('Can partially unstake arbitrary amount', async ({helper}) => {
      const staker = accounts.pop()!;
      await helper.staking.stake(staker, 100n * nominal);
      await helper.staking.stake(staker, 200n * nominal);

      // 0. Staker cannot unstake negative amount
      await expect(helper.staking.unstakePartial(staker, -1n)).to.be.rejected;

      // 1. Staker can unstake 0 wei
      await helper.staking.unstakePartial(staker, 0n);
      expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(2);
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.eq(300n * nominal);
      expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.eq(0n);

      // 2. Staker can unstake 1 wei
      await helper.staking.unstakePartial(staker, 1n);
      expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(2);
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.eq(300n * nominal - 1n);
      expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.eq(1n);
      // 2.1 The oldest stake decreased:
      let [stake1, stake2] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      expect(stake1.amount).to.eq(100n * nominal - 1n);
      expect(stake2.amount).to.eq(200n * nominal);

      // 3. Staker can unstake all but 1 wei
      await helper.staking.unstakePartial(staker, 100n * nominal - 2n);
      expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(2);
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.eq(200n * nominal + 1n);
      expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.eq(100n * nominal - 1n);
      [stake1, stake2] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      expect(stake1.amount).to.eq(1n);
      expect(stake2.amount).to.eq(200n * nominal);
    });

    itSub('can mix different type of unstakes', async ({helper}) => {
      const staker = accounts.pop()!;
      await helper.staking.stake(staker, 100n * nominal);
      await helper.staking.stake(staker, 200n * nominal);

      await helper.staking.unstakePartial(staker, 50n * nominal);
      await helper.staking.unstakeAll(staker);
      expect(await helper.staking.getStakesNumber({Substrate: staker.address})).to.eq(0);
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.eq(0n);
      expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.eq(300n * nominal);

      const [_unstake1, unstake2] = await helper.staking.getPendingUnstakePerBlock({Substrate: staker.address});
      await helper.wait.forParachainBlockNumber(unstake2.block);

      expect(await helper.balance.getLocked(staker.address)).to.deep.eq([]);
      expect(await helper.balance.getSubstrateFull(staker.address)).to.deep.contain({reserved: 0n, miscFrozen: 0n, feeFrozen: 0n});
      expect(await helper.balance.getSubstrate(staker.address) / nominal).to.eq(999n);
      expect(await helper.staking.getTotalStaked({Substrate: staker.address})).to.eq(0n);
      expect(await helper.staking.getPendingUnstake({Substrate: staker.address})).to.eq(0n);
      expect(await helper.staking.getPendingUnstakePerBlock({Substrate: staker.address})).to.deep.eq([]);
    });
  });

  describe('collection sponsoring', () => {
    itSub('should actually sponsor transactions', async ({helper}) => {
      const api = helper.getApi();
      const [collectionOwner, tokenSender, receiver] = [accounts.pop()!, accounts.pop()!, accounts.pop()!];
      const collection = await helper.nft.mintCollection(collectionOwner, {name: 'Name', description: 'Description', tokenPrefix: 'Prefix', limits: {sponsorTransferTimeout: 0}});
      const token = await collection.mintToken(collectionOwner, {Substrate: tokenSender.address});
      await helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collection.collectionId));
      const palletBalanceBefore = await helper.balance.getSubstrate(palletAddress);

      await token.transfer(tokenSender, {Substrate: receiver.address});
      expect (await token.getOwner()).to.be.deep.equal({Substrate: receiver.address});
      const palletBalanceAfter = await helper.balance.getSubstrate(palletAddress);

      // senders balance the same, transaction has sponsored
      expect (await helper.balance.getSubstrate(tokenSender.address)).to.be.equal(1000n * nominal);
      expect (palletBalanceBefore > palletBalanceAfter).to.be.true;
    });

    itSub('can not be set by non admin', async ({helper}) => {
      const api = helper.getApi();
      const [collectionOwner, nonAdmin] = [accounts.pop()!, accounts.pop()!];

      const collection  = await helper.nft.mintCollection(collectionOwner, {name: 'New', description: 'New Collection', tokenPrefix: 'Promotion'});

      await expect(helper.signTransaction(nonAdmin, api.tx.appPromotion.sponsorCollection(collection.collectionId))).to.be.rejected;
      expect((await collection.getData())?.raw.sponsorship).to.equal('Disabled');
    });

    itSub('should set pallet address as confirmed admin', async ({helper}) => {
      const api = helper.getApi();
      const [collectionOwner, oldSponsor] = [accounts.pop()!, accounts.pop()!];

      // Can set sponsoring for collection without sponsor
      const collectionWithoutSponsor = await helper.nft.mintCollection(collectionOwner, {name: 'No-sponsor', description: 'New Collection', tokenPrefix: 'Promotion'});
      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collectionWithoutSponsor.collectionId))).to.be.fulfilled;
      expect((await collectionWithoutSponsor.getData())?.raw.sponsorship).to.be.deep.equal({Confirmed: palletAddress});

      // Can set sponsoring for collection with unconfirmed sponsor
      const collectionWithUnconfirmedSponsor = await helper.nft.mintCollection(collectionOwner, {name: 'Unconfirmed', description: 'New Collection', tokenPrefix: 'Promotion', pendingSponsor: oldSponsor.address});
      expect((await collectionWithUnconfirmedSponsor.getData())?.raw.sponsorship).to.be.deep.equal({Unconfirmed: oldSponsor.address});
      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collectionWithUnconfirmedSponsor.collectionId))).to.be.fulfilled;
      expect((await collectionWithUnconfirmedSponsor.getData())?.raw.sponsorship).to.be.deep.equal({Confirmed: palletAddress});

      // Can set sponsoring for collection with confirmed sponsor
      const collectionWithConfirmedSponsor = await helper.nft.mintCollection(collectionOwner, {name: 'Confirmed', description: 'New Collection', tokenPrefix: 'Promotion', pendingSponsor: oldSponsor.address});
      await collectionWithConfirmedSponsor.confirmSponsorship(oldSponsor);
      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collectionWithConfirmedSponsor.collectionId))).to.be.fulfilled;
      expect((await collectionWithConfirmedSponsor.getData())?.raw.sponsorship).to.be.deep.equal({Confirmed: palletAddress});
    });

    itSub('can be overwritten by collection owner', async ({helper}) => {
      const api = helper.getApi();
      const [collectionOwner, newSponsor] = [accounts.pop()!, accounts.pop()!];
      const collection  = await helper.nft.mintCollection(collectionOwner, {name: 'New', description: 'New Collection', tokenPrefix: 'Promotion'});
      const collectionId = collection.collectionId;

      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collectionId))).to.be.fulfilled;

      // Collection limits still can be changed by the owner
      expect(await collection.setLimits(collectionOwner, {sponsorTransferTimeout: 0})).to.be.true;
      expect((await collection.getData())?.raw.limits.sponsorTransferTimeout).to.be.equal(0);
      expect((await collection.getData())?.raw.sponsorship).to.be.deep.equal({Confirmed: palletAddress});

      // Collection sponsor can be changed too
      expect((await collection.setSponsor(collectionOwner, newSponsor.address))).to.be.true;
      expect((await collection.getData())?.raw.sponsorship).to.be.deep.equal({Unconfirmed: newSponsor.address});
    });

    itSub('should not overwrite collection limits set by the owner earlier', async ({helper}) => {
      const api = helper.getApi();
      const limits = {ownerCanDestroy: true, ownerCanTransfer: true, sponsorTransferTimeout: 0};
      const collectionWithLimits = await helper.nft.mintCollection(accounts.pop()!, {name: 'New', description: 'New Collection', tokenPrefix: 'Promotion', limits});

      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collectionWithLimits.collectionId))).to.be.fulfilled;
      expect((await collectionWithLimits.getData())?.raw.limits).to.be.deep.contain(limits);
    });

    itSub('should reject transaction if collection doesn\'t exist', async ({helper}) => {
      const api = helper.getApi();
      const collectionOwner = accounts.pop()!;

      // collection has never existed
      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(999999999))).to.be.rejected;
      // collection has been burned
      const collection = await helper.nft.mintCollection(collectionOwner, {name: 'New', description: 'New Collection', tokenPrefix: 'Promotion'});
      await collection.burn(collectionOwner);

      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collection.collectionId))).to.be.rejected;
    });
  });

  describe('stopSponsoringCollection', () => {
    itSub('can not be called by non-admin', async ({helper}) => {
      const api = helper.getApi();
      const [collectionOwner, nonAdmin] = [accounts.pop()!, accounts.pop()!];
      const collection = await helper.nft.mintCollection(collectionOwner, {name: 'New', description: 'New Collection', tokenPrefix: 'Promotion'});

      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collection.collectionId))).to.be.fulfilled;

      await expect(helper.signTransaction(nonAdmin, api.tx.appPromotion.stopSponsoringCollection(collection.collectionId))).to.be.rejected;
      expect((await collection.getData())?.raw.sponsorship).to.be.deep.equal({Confirmed: palletAddress});
    });

    itSub('should set sponsoring as disabled', async ({helper}) => {
      const api = helper.getApi();
      const [collectionOwner, recepient] = [accounts.pop()!, accounts.pop()!];
      const collection = await helper.nft.mintCollection(collectionOwner, {name: 'New', description: 'New Collection', tokenPrefix: 'Promotion', limits: {sponsorTransferTimeout: 0}});
      const token = await collection.mintToken(collectionOwner, {Substrate: collectionOwner.address});

      await helper.signTransaction(palletAdmin, api.tx.appPromotion.sponsorCollection(collection.collectionId));
      await helper.signTransaction(palletAdmin, api.tx.appPromotion.stopSponsoringCollection(collection.collectionId));

      expect((await collection.getData())?.raw.sponsorship).to.be.equal('Disabled');

      // Transactions are not sponsored anymore:
      const ownerBalanceBefore = await helper.balance.getSubstrate(collectionOwner.address);
      await token.transfer(collectionOwner, {Substrate: recepient.address});
      const ownerBalanceAfter = await helper.balance.getSubstrate(collectionOwner.address);
      expect(ownerBalanceAfter < ownerBalanceBefore).to.be.equal(true);
    });

    itSub('should not affect collection which is not sponsored by pallete', async ({helper}) => {
      const api = helper.getApi();
      const collectionOwner = accounts.pop()!;
      const collection = await helper.nft.mintCollection(collectionOwner, {name: 'New', description: 'New Collection', tokenPrefix: 'Promotion', pendingSponsor: collectionOwner.address});
      await collection.confirmSponsorship(collectionOwner);

      await expect(helper.signTransaction(palletAdmin, api.tx.appPromotion.stopSponsoringCollection(collection.collectionId))).to.be.rejected;

      expect((await collection.getData())?.raw.sponsorship).to.be.deep.equal({Confirmed: collectionOwner.address});
    });

    itSub('should reject transaction if collection does not exist', async ({helper}) => {
      const collectionOwner = accounts.pop()!;
      const collection = await helper.nft.mintCollection(collectionOwner, {name: 'New', description: 'New Collection', tokenPrefix: 'Promotion'});

      await collection.burn(collectionOwner);
      await expect(helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.stopSponsoringCollection', [collection.collectionId], true)).to.be.rejectedWith('common.CollectionNotFound');
      await expect(helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.stopSponsoringCollection', [999_999_999], true)).to.be.rejectedWith('common.CollectionNotFound');
    });
  });

  describe('contract sponsoring', () => {
    itEth('should set palletes address as a sponsor', async ({helper}) => {
      const contractOwner = (await helper.eth.createAccountWithBalance(donor, 1000n)).toLowerCase();
      const flipper = await helper.eth.deployFlipper(contractOwner); // await deployFlipper(web3, contractOwner);
      const contractHelper = await helper.ethNativeContract.contractHelpers(contractOwner);

      await helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.sponsorContract', [flipper.options.address]);

      expect(await contractHelper.methods.hasSponsor(flipper.options.address).call()).to.be.true;
      expect((await helper.callRpc('api.query.evmContractHelpers.owner', [flipper.options.address])).toJSON()).to.be.equal(contractOwner);
      expect((await helper.callRpc('api.query.evmContractHelpers.sponsoring', [flipper.options.address])).toJSON()).to.deep.equal({
        confirmed: {
          substrate: palletAddress,
        },
      });
    });

    itEth('should overwrite sponsoring mode and existed sponsor', async ({helper}) => {
      const contractOwner = (await helper.eth.createAccountWithBalance(donor, 1000n)).toLowerCase();
      const flipper = await helper.eth.deployFlipper(contractOwner); // await deployFlipper(web3, contractOwner);
      const contractHelper = await helper.ethNativeContract.contractHelpers(contractOwner);

      await expect(contractHelper.methods.selfSponsoredEnable(flipper.options.address).send()).to.be.fulfilled;

      // Contract is self sponsored
      expect((await helper.callRpc('api.query.evmContractHelpers.sponsoring', [flipper.options.address])).toJSON()).to.be.deep.equal({
        confirmed: {
          ethereum: flipper.options.address.toLowerCase(),
        },
      });

      // set promotion sponsoring
      await helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.sponsorContract', [flipper.options.address], true);

      // new sponsor is pallet address
      expect(await contractHelper.methods.hasSponsor(flipper.options.address).call()).to.be.true;
      expect((await helper.callRpc('api.query.evmContractHelpers.owner', [flipper.options.address])).toJSON()).to.be.equal(contractOwner);
      expect((await helper.callRpc('api.query.evmContractHelpers.sponsoring', [flipper.options.address])).toJSON()).to.deep.equal({
        confirmed: {
          substrate: palletAddress,
        },
      });
    });

    itEth('can be overwritten by contract owner', async ({helper}) => {
      const contractOwner = (await helper.eth.createAccountWithBalance(donor, 1000n)).toLowerCase();
      const flipper = await helper.eth.deployFlipper(contractOwner); // await deployFlipper(web3, contractOwner);
      const contractHelper = await helper.ethNativeContract.contractHelpers(contractOwner);

      // contract sponsored by pallet
      await helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.sponsorContract', [flipper.options.address], true);

      // owner sets self sponsoring
      await expect(contractHelper.methods.selfSponsoredEnable(flipper.options.address).send()).to.be.not.rejected;

      expect(await contractHelper.methods.hasSponsor(flipper.options.address).call()).to.be.true;
      expect((await helper.callRpc('api.query.evmContractHelpers.owner', [flipper.options.address])).toJSON()).to.be.equal(contractOwner);
      expect((await helper.callRpc('api.query.evmContractHelpers.sponsoring', [flipper.options.address])).toJSON()).to.deep.equal({
        confirmed: {
          ethereum: flipper.options.address.toLowerCase(),
        },
      });
    });

    itEth('can not be set by non admin', async ({helper}) => {
      const nonAdmin = accounts.pop()!;
      const contractOwner = (await helper.eth.createAccountWithBalance(donor, 1000n)).toLowerCase();
      const flipper = await helper.eth.deployFlipper(contractOwner); // await deployFlipper(web3, contractOwner);
      const contractHelper = await helper.ethNativeContract.contractHelpers(contractOwner);

      await expect(contractHelper.methods.selfSponsoredEnable(flipper.options.address).send()).to.be.fulfilled;

      // nonAdmin calls sponsorContract
      await expect(helper.executeExtrinsic(nonAdmin, 'api.tx.appPromotion.sponsorContract', [flipper.options.address], true)).to.be.rejectedWith('appPromotion.NoPermission');

      // contract still self-sponsored
      expect((await helper.callRpc('api.query.evmContractHelpers.sponsoring', [flipper.options.address])).toJSON()).to.deep.equal({
        confirmed: {
          ethereum: flipper.options.address.toLowerCase(),
        },
      });
    });

    itEth('should actually sponsor transactions', async ({helper}) => {
      // Contract caller
      const caller = await helper.eth.createAccountWithBalance(donor, 1000n);
      const palletBalanceBefore = await helper.balance.getSubstrate(palletAddress);

      // Deploy flipper
      const contractOwner = (await helper.eth.createAccountWithBalance(donor, 1000n)).toLowerCase();
      const flipper = await helper.eth.deployFlipper(contractOwner); // await deployFlipper(web3, contractOwner);
      const contractHelper = await helper.ethNativeContract.contractHelpers(contractOwner);

      // Owner sets to sponsor every tx
      await contractHelper.methods.setSponsoringRateLimit(flipper.options.address, 0).send({from: contractOwner});
      await contractHelper.methods.setSponsoringMode(flipper.options.address, SponsoringMode.Generous).send({from: contractOwner});
      await helper.eth.transferBalanceFromSubstrate(donor, flipper.options.address, 1000n); // transferBalanceToEth(api, alice, flipper.options.address, 1000n);

      // Set promotion to the Flipper
      await helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.sponsorContract', [flipper.options.address], true);

      // Caller calls Flipper
      await flipper.methods.flip().send({from: caller});
      expect(await flipper.methods.getValue().call()).to.be.true;

      // The contracts and caller balances have not changed
      const callerBalance = await helper.balance.getEthereum(caller);
      const contractBalanceAfter = await helper.balance.getEthereum(flipper.options.address);
      expect(callerBalance).to.be.equal(1000n * nominal);
      expect(1000n * nominal === contractBalanceAfter).to.be.true;

      // The pallet balance has decreased
      const palletBalanceAfter = await helper.balance.getSubstrate(palletAddress);
      expect(palletBalanceAfter < palletBalanceBefore).to.be.true;
    });
  });

  describe('stopSponsoringContract', () => {
    itEth('should remove pallet address from contract sponsors', async ({helper}) => {
      const caller = await helper.eth.createAccountWithBalance(donor, 1000n);
      const contractOwner = (await helper.eth.createAccountWithBalance(donor, 1000n)).toLowerCase();
      const flipper = await helper.eth.deployFlipper(contractOwner);
      await helper.eth.transferBalanceFromSubstrate(donor, flipper.options.address);
      const contractHelper = await helper.ethNativeContract.contractHelpers(contractOwner);

      await contractHelper.methods.setSponsoringMode(flipper.options.address, SponsoringMode.Generous).send({from: contractOwner});
      await helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.sponsorContract', [flipper.options.address], true);
      await helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.stopSponsoringContract', [flipper.options.address], true);

      expect(await contractHelper.methods.hasSponsor(flipper.options.address).call()).to.be.false;
      expect((await helper.callRpc('api.query.evmContractHelpers.owner', [flipper.options.address])).toJSON()).to.be.equal(contractOwner);
      expect((await helper.callRpc('api.query.evmContractHelpers.sponsoring', [flipper.options.address])).toJSON()).to.deep.equal({
        disabled: null,
      });

      await flipper.methods.flip().send({from: caller});
      expect(await flipper.methods.getValue().call()).to.be.true;

      const callerBalance = await helper.balance.getEthereum(caller);
      const contractBalanceAfter = await helper.balance.getEthereum(flipper.options.address);

      // caller payed for call
      expect(1000n * nominal > callerBalance).to.be.true;
      expect(contractBalanceAfter).to.be.equal(100n * nominal);
    });

    itEth('can not be called by non-admin', async ({helper}) => {
      const nonAdmin = accounts.pop()!;
      const contractOwner = (await helper.eth.createAccountWithBalance(donor, 1000n)).toLowerCase();
      const flipper = await helper.eth.deployFlipper(contractOwner);

      await helper.executeExtrinsic(palletAdmin, 'api.tx.appPromotion.sponsorContract', [flipper.options.address]);
      await expect(helper.executeExtrinsic(nonAdmin, 'api.tx.appPromotion.stopSponsoringContract', [flipper.options.address]))
        .to.be.rejectedWith(/appPromotion\.NoPermission/);
    });

    itEth('should not affect a contract which is not sponsored by pallete', async ({helper}) => {
      const nonAdmin = accounts.pop()!;
      const contractOwner = (await helper.eth.createAccountWithBalance(donor, 1000n)).toLowerCase();
      const flipper = await helper.eth.deployFlipper(contractOwner);
      const contractHelper = await helper.ethNativeContract.contractHelpers(contractOwner);
      await expect(contractHelper.methods.selfSponsoredEnable(flipper.options.address).send()).to.be.fulfilled;

      await expect(helper.executeExtrinsic(nonAdmin, 'api.tx.appPromotion.stopSponsoringContract', [flipper.options.address], true)).to.be.rejectedWith('appPromotion.NoPermission');
    });
  });

  describe('payoutStakers', () => {
    itSub('can not be called by non admin', async ({helper}) => {
      const nonAdmin = accounts.pop()!;
      await expect(helper.admin.payoutStakers(nonAdmin, 100)).to.be.rejectedWith('appPromotion.NoPermission');
    });

    itSub('should increase total staked', async ({helper}) => {
      const staker = accounts.pop()!;
      const totalStakedBefore = await helper.staking.getTotalStaked();
      await helper.staking.stake(staker, 100n * nominal);

      // Wait for rewards and pay
      const [stakedInBlock] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      await helper.wait.forRelayBlockNumber(rewardAvailableInBlock(stakedInBlock.block));
      const totalPayout = (await helper.admin.payoutStakers(palletAdmin, 100)).reduce((prev, payout) => prev + payout.payout, 0n);

      const totalStakedAfter = await helper.staking.getTotalStaked();
      expect(totalStakedAfter).to.equal(totalStakedBefore + (100n * nominal) + totalPayout);
      // staker can unstake
      await helper.staking.unstakeAll(staker);
      expect(await helper.staking.getTotalStaked()).to.be.equal(totalStakedAfter - calculateIncome(100n * nominal));
    });

    itSub('should credit 0.05% for staking period', async ({helper}) => {
      const staker = accounts.pop()!;

      await waitPromotionPeriodDoesntEnd(helper);

      await helper.staking.stake(staker, 100n * nominal);
      await helper.staking.stake(staker, 200n * nominal);

      // wait rewards are available:
      const [_stake1, stake2] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      await helper.wait.forRelayBlockNumber(rewardAvailableInBlock(stake2.block));

      const payoutToStaker = (await helper.admin.payoutStakers(palletAdmin, 100)).find((payout) => payout.staker === staker.address)?.payout;
      expect(payoutToStaker + 300n * nominal).to.equal(calculateIncome(300n * nominal));

      const totalStakedPerBlock = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      const income1 = calculateIncome(100n * nominal);
      const income2 = calculateIncome(200n * nominal);
      expect(totalStakedPerBlock[0].amount).to.equal(income1);
      expect(totalStakedPerBlock[1].amount).to.equal(income2);

      const stakerBalance = await helper.balance.getSubstrateFull(staker.address);
      expect(stakerBalance).to.contain({miscFrozen: income1 + income2, feeFrozen: income1 + income2, reserved: 0n});
      expect(stakerBalance.free / nominal).to.eq(999n);
    });

    itSub('shoud be paid for more than one period if payments was missed', async ({helper}) => {
      const staker = accounts.pop()!;

      await helper.staking.stake(staker, 100n * nominal);
      // wait for two rewards are available:
      let [stake] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      await helper.wait.forRelayBlockNumber(rewardAvailableInBlock(stake.block) + LOCKING_PERIOD);

      await helper.admin.payoutStakers(palletAdmin, 100);
      [stake] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      const frozenBalanceShouldBe = calculateIncome(100n * nominal, 2);
      expect(stake.amount).to.be.equal(frozenBalanceShouldBe);

      const stakerFullBalance = await helper.balance.getSubstrateFull(staker.address);

      expect(stakerFullBalance).to.contain({reserved: 0n, feeFrozen: frozenBalanceShouldBe, miscFrozen: frozenBalanceShouldBe});
    });

    itSub('should not be credited for pending-unstaked tokens', async ({helper}) => {
      // staker unstakes before rewards been payed
      const staker = accounts.pop()!;
      await helper.staking.stake(staker, 100n * nominal);
      const [stake] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      await helper.wait.forRelayBlockNumber(rewardAvailableInBlock(stake.block) + LOCKING_PERIOD);
      await helper.staking.unstakeAll(staker);

      // so he did not receive any rewards
      const totalBalanceBefore = await helper.balance.getSubstrate(staker.address);
      await helper.admin.payoutStakers(palletAdmin, 100);
      const totalBalanceAfter = await helper.balance.getSubstrate(staker.address);

      expect(totalBalanceBefore).to.be.equal(totalBalanceAfter);
    });

    itSub('should bring compound interest', async ({helper}) => {
      const staker = accounts.pop()!;

      await helper.staking.stake(staker, 100n * nominal);

      let [stake] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      await helper.wait.forRelayBlockNumber(rewardAvailableInBlock(stake.block));

      await helper.admin.payoutStakers(palletAdmin, 100);
      [stake] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      expect(stake.amount).to.equal(calculateIncome(100n * nominal));

      await helper.wait.forRelayBlockNumber(rewardAvailableInBlock(stake.block) + LOCKING_PERIOD);
      await helper.admin.payoutStakers(palletAdmin, 100);
      [stake] = await helper.staking.getTotalStakedPerBlock({Substrate: staker.address});
      expect(stake.amount).to.equal(calculateIncome(100n * nominal, 2));
    });

    itSub.skip('can be paid 1000 rewards in a time', async ({helper}) => {
      // all other stakes should be unstaked
      const oneHundredStakers = await helper.arrange.createCrowd(100, 1050n, donor);

      // stakers stakes 10 times each
      for (let i = 0; i < 10; i++) {
        await Promise.all(oneHundredStakers.map(staker => helper.staking.stake(staker, 100n * nominal)));
      }
      await helper.wait.newBlocks(40);
      await helper.admin.payoutStakers(palletAdmin, 100);
    });

    itSub.skip('can handle 40.000 rewards', async ({helper}) => {
      const crowdStakes = async () => {
        // each account in the crowd stakes 2 times
        const crowd = await helper.arrange.createCrowd(500, 300n, donor);
        await Promise.all(crowd.map(account => helper.staking.stake(account, 100n * nominal)));
        await Promise.all(crowd.map(account => helper.staking.stake(account, 100n * nominal)));
        //
      };

      for (let i = 0; i < 40; i++) {
        await crowdStakes();
      }

      // TODO pay rewards for some period
    });
  });
});

function calculateIncome(base: bigint, iter = 0, calcPeriod: bigint = UNLOCKING_PERIOD): bigint {
  const DAY = 7200n;
  const ACCURACY = 1_000_000_000n;
  // 5n / 10_000n = 0.05% p/day
  const income = base + base * (ACCURACY * (calcPeriod * 5n) / (10_000n * DAY)) / ACCURACY ;

  if (iter > 1) {
    return calculateIncome(income, iter - 1, calcPeriod);
  } else return income;
}

function rewardAvailableInBlock(stakedInBlock: bigint) {
  if (stakedInBlock % LOCKING_PERIOD === 0n) return stakedInBlock + LOCKING_PERIOD;
  return (stakedInBlock - stakedInBlock % LOCKING_PERIOD) + (LOCKING_PERIOD * 2n);
}

// Wait while promotion period less than specified block, to avoid boundary cases
// 0 if this should be the beginning of the period.
async function waitPromotionPeriodDoesntEnd(helper: DevUniqueHelper, waitBlockLessThan = LOCKING_PERIOD / 3n) {
  const relayBlockNumber = (await helper.callRpc('api.query.parachainSystem.validationData', [])).value.relayParentNumber.toNumber(); // await helper.chain.getLatestBlockNumber();
  const currentPeriodBlock = BigInt(relayBlockNumber) % LOCKING_PERIOD;

  if (currentPeriodBlock > waitBlockLessThan) {
    await helper.wait.forRelayBlockNumber(BigInt(relayBlockNumber) + LOCKING_PERIOD - currentPeriodBlock);
  }
}
