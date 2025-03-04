import { AminoConverters, AminoTypes, isDeliverTxSuccess, StdFee } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import {
  TxRaw,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {

  buildCockyTxToDoOptimizationDelegate,
  buildCockyTxToDoOptimizationReDelegate,
  buildExecDelegateMsg, buildExecRedelegateMsg,
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

const granteeAddress = 'cosmos1fgrg3uax5td2ex05dwwdydgrs4kf9hl2gx5z8j';
const granterAddress = 'cosmos1yhf8834qffd32m887sukr3l9382zjhrw7pryq0';
const memo = '';
const privKey = '';

const emptyValidatorsList = [''];
const validatorsList = [''];

const rpcEndpoint = '';
const restEndpoint = '';

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

  return [delegateGrant, redelegateGrant];
};

const signAndBroadcastTx = async () => {
  try {
    const client = await createSigningClient(
      true,
      { privKey },
      rpcEndpoint,
      {
        registry,
        aminoTypes,
      },
      'cosmoshub'
    );

    const msgs = createMsgs();
    const gasFee: StdFee = getDefaultGasFee('uatom');

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
  console.log('grants', grants);

};

const run = async () => {
  await signAndBroadcastTx();

  // await queryData();
};

run();

