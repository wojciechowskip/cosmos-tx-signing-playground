import { AminoConverters, AminoTypes, isDeliverTxSuccess, SigningStargateClient, StdFee } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import {
  TxRaw,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {

  buildCockyTxToDoOptimizationDelegate,
  buildCockyTxToDoOptimizationReDelegate, buildDelegate,
  buildExecDelegateMsg, buildExecRedelegateMsg, buildRevokeMsgForStaking,
} from './messages-composers';
import {
  cosmosProtoRegistry,
  cosmosAminoConverters,
  lavanetAminoConverters,
  lavanetProtoRegistry, cosmos,
} from 'cosmos-js-telescope';
import { createRPCQueryClient } from 'cosmos-js-telescope/lavanet/rpc.query';
import { createSigningClient } from './signer';
import { getDefaultGasFee } from './default-gas-fee';

import { bech32 } from 'bech32';
import { ethers } from 'ethers';
import query = cosmos.base.query;

// function evmToCosmosAddress(evmAddress: string, prefix = "ki") {
//   const stripped = evmAddress.replace(/^0x/, "");
//   const bytes = ethers.getBytes("0x" + stripped);
//   return bech32.encode(prefix, bech32.toWords(bytes));
// }
//
// console.log(evmToCosmosAddress("0x3c21b7e53aa48731a735bc5b523db938072bd6b8", "kii"));

const granteeAddress = 'cosmos1zckqq52ax0g328quqhwhht4l4n0z22rxrymxka';
const granterAddress = 'kii1yhf8834qffd32m887sukr3l9382zjhrw82ewks';
const memo = '';
const privKey = '';

const emptyValidatorsList = [''];
const validatorsList = [''];

const rpcEndpoint = 'https://rpc.uno.sentry.testnet.v3.kiivalidator.com/';
const restEndpoint = 'https://lcd.uno.sentry.testnet.v3.kiivalidator.com/';

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
  //
  const delegateGrant = buildCockyTxToDoOptimizationDelegate(granterAddress, granteeAddress);

  //
  const redelegateGrant = buildCockyTxToDoOptimizationReDelegate(granterAddress, granteeAddress);

  const execDelegate = buildExecDelegateMsg(granterAddress, granteeAddress, 'cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn');

  const execRedelegate = buildExecRedelegateMsg(granterAddress, granteeAddress, 'cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn', 'cosmosvaloper1x8efhljzvs52u5xa6m7crcwes7v9u0nlwdgw30');

  const revoke = buildRevokeMsgForStaking(granterAddress, granteeAddress);

  const delegate = buildDelegate(granterAddress, 'kiivaloper1esxwa5vm8rae2n2te7ea3f49c70tjemyh4uqq5');

  return [delegate];
};

const signAndBroadcastTx = async () => {
  try {
    const client: SigningStargateClient = await createSigningClient(
      false,
      { privKey },
      rpcEndpoint,
      {
        registry,
        aminoTypes,
      },
      'kiichain',
    );

    const msgs = createMsgs();
    const gasFee: StdFee = getDefaultGasFee('ukii');

    const signed = await client.sign(
      granterAddress,
      msgs,
      gasFee,
      '',
    );

    const broadcastRes = await client.broadcastTx(
      Uint8Array.from(TxRaw.encode(signed).finish()),
    );

    // if (isDeliverTxSuccess(broadcastRes)) {
    //
    // } else {
    //   console.error('Transaction failed >>', broadcastRes.rawLog);
    //   new Error('Transaction failed');
    // }

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
  const grants = await queryClient.cosmos.authz.v1beta1.granterGrants({
    granter: granterAddress,
  });
  //
  // console.log('grants', grants);
  const grantsForGrantee = grants.grants.filter(grant => grant.grantee === granteeAddress);
  console.log('grants', grantsForGrantee);

  // const delegations = await queryClient.cosmos.staking.v1beta1.delegatorDelegations({
  //   delegatorAddr: 'cosmos1hlm58hvene3nwkvs8gx68afslnfuhvlcyk0qtt'
  // })
  //
  // console.log(delegations.delegationResponses[0]);



};

const run = async () => {
  await signAndBroadcastTx();

  // await queryData();
};

run();

