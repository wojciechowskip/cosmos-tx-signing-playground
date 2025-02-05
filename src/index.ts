import { AminoConverters, AminoTypes, isDeliverTxSuccess, StdFee } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import {
  TxRaw,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {
  buildGrantMsgForFee,
  buildGrantMsgForStaking,
  buildGrantMsgForTransfers,
  buildGrantMsgForProviderCompound,
  buildLavaCompound,
  buildGrantMsgForProviderRwrdClaim,
  buildProviderRewardClaim,
  buildTransferExecMsg,
} from './messages-composers';
import {
  cosmosProtoRegistry,
  cosmosAminoConverters,
  lavanetAminoConverters,
  lavanetProtoRegistry,
} from 'cosmos-js-telescope';
import { createRPCQueryClient } from 'cosmos-js-telescope/lavanet/rpc.query';
import { createSigningClient } from './signer';
import { getDefaultGasFee } from './default-gas-fee';

const granteeAddress = 'lava@1fgrg3uax5td2ex05dwwdydgrs4kf9hl2s7r8ql';
const granterAddress = 'lava@1yhf8834qffd32m887sukr3l9382zjhrwxe5p8z';
const memo = '';
const privKey = '';

const emptyValidatorsList = [''];
const validatorsList = ['cosmosvaloper1qje005kmeztf34pec5f6fd35p833ynvagdkqan'];

const rpcEndpoint = 'https://rpc.lavenderfive.com/lava';
const restEndpoint = 'https://rest.lavenderfive.com/lava';

console.log('Starting script... ✨');

console.log('Grantee address >>> ', granteeAddress);
console.log('Granter address >>> ', granterAddress);
console.log('Validator list address >>> ', validatorsList);

const converters: AminoConverters = {
  ...cosmosAminoConverters,
  ...lavanetAminoConverters,
};

const registry = new Registry([
  ...cosmosProtoRegistry,
  ...lavanetProtoRegistry,
]);

const aminoTypes = new AminoTypes({
  ...converters,
});

const createMsgs = () => {
  // Staking
  const stakingMsg = buildGrantMsgForStaking(granterAddress, granteeAddress);

  // Transfer
  const transferMsg = buildGrantMsgForTransfers(granterAddress, granteeAddress);

  // Fee
  const feeMSg = buildGrantMsgForFee(granterAddress, granteeAddress);

  // Lava grant to compound provider rewards
  const lavaProviderCompoundPermission = buildGrantMsgForProviderCompound(granterAddress, granteeAddress);

  // Lava grant to claim rewards
  const lavaProviderClaimRewardsPermission = buildGrantMsgForProviderRwrdClaim(granterAddress, granteeAddress);

  // Lava provider reward claim
  const lavaProviderRewardClaim = buildProviderRewardClaim(granterAddress, granteeAddress);

  // Lava provider compoundg / delegation
  const lavaCompound = buildLavaCompound(granterAddress, granteeAddress);

  // exec tranfer
  const transferExec = buildTransferExecMsg(granterAddress, granteeAddress);

  return [lavaProviderCompoundPermission];
};

const signAndBroadcastTx = async () => {
  try {
    const client = await createSigningClient(
      false,
      { memo },
      rpcEndpoint,
      {
        registry,
        aminoTypes,
      },
    );

    const msgs = createMsgs();
    const gasFee: StdFee = getDefaultGasFee('ulava');

    // @ts-ignore
    const signed = await client.sign(
      granterAddress,
      msgs,
      gasFee,
      '',
    );

    const broadcastRes = await client.broadcastTx(
      Uint8Array.from(TxRaw.encode(signed).finish()),
    );

    if (isDeliverTxSuccess(broadcastRes)) {

    } else {
      console.error('Transaction failed >>', broadcastRes.rawLog);
      new Error('Transaction failed');
    }

  } catch (e) {
    console.error('Error during script run', e);
  } finally {
    console.log('Script finished... ✨');
  }
};

const queryData = async () => {

  const queryClient = await createRPCQueryClient({ rpcEndpoint });
  //
  // const feegrants = await queryClient.cosmos.feegrant.v1beta1.allowances({grantee: granteeAddress});
  //
  // console.log('feegrants', feegrants.allowances);
  //
  const grants = await queryClient.cosmos.authz.v1beta1.granteeGrants({
    grantee: granteeAddress,
  });
  //
  console.log('grants', grants.grants.filter((grant) => grant.granter === granterAddress));
  // console.log('grants', grants.grants);

  // queryClient.lavanet.lava.dualstaking.delegatorProviders({
  //   delegator: 'lava@1yhf8834qffd32m887sukr3l9382zjhrwxe5p8z',
  //   withPending: true,
  // }).then((res) => {
  //   console.log('res', res);
  // }).catch((e) => {
  //   console.log('e', e);
  // });
  //
  // console.log('delegatorRewards ---------')
  // queryClient.lavanet.lava.dualstaking.delegatorRewards({
  //   delegator:'lava@1yhf8834qffd32m887sukr3l9382zjhrwxe5p8z',
  //   provider: 'lava@18rtt3ka0jc85qvvcnct0t7ayq6fva7692k9kvh',
  //   chainId: '*',
  // }).then((res) => {
  //   console.log('res', JSON.stringify(res));
  // }).catch((e) => {
  //   console.log('e', e);
  //   console.log('e', e);
  // });
  //
  // console.log('delegatorRewardsList ---------')
  // queryClient.lavanet.lava.dualstaking.delegatorRewardsList({
  //   delegator: 'lava@1yhf8834qffd32m887sukr3l9382zjhrwxe5p8z',
  //   provider: 'lava@1pew9nxdepfnap3mkkcmvkemls4c5uets9rqq2h',
  //   chainId: '*',
  // }).then((res) => {
  //   console.log('res', JSON.stringify(res));
  // }).catch((e) => {
  //   console.log('e', e);
  // });
};

const run = async () => {
  // await signAndBroadcastTx();

  // await queryData();
};

run();

// Setup for normal message builders & composers
// "@cosmjs/stargate": "0.32.4",
// "cosmos-js-telescope": "^0.0.34",

// Setup for message composers only (v-next env on telescope config cause builders not to work anymore)
// "@cosmjs/stargate": "npm:@liftedinit/stargate@0.32.4-ll.3",
// "cosmos-js-telescope": "0.0.33",
//
// "resolutions": {
//   "**/@cosmjs/stargate": "npm:@liftedinit/stargate@0.32.4-ll.3"
// }

// Setup to have working Grant + StakeAuth requires composers which does not do any encode stuff
// "cosmos-js-telescope": "^0.0.35",
