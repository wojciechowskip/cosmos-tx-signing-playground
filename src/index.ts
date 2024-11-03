import { AminoConverters, isDeliverTxSuccess } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import {
  TxRaw,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {
  StdFee,
  AminoTypes,
  defaultRegistryTypes,
  SigningStargateClient,
  createGovAminoConverters,
  createIbcAminoConverters,
  createBankAminoConverters,
  createStakingAminoConverters,
  createFeegrantAminoConverters,
  createDistributionAminoConverters,
} from '@cosmjs/stargate';
import { createCustomAuthzConverters } from './converters';
import { buildGrantMsgForFee, buildGrantMsgForStaking, buildGrantMsgForTransfers } from './messages-builder';
import { getOfflineSignerAmino } from 'cosmjs-utils';

// do not commit! replace with your own private key
const mnemo = '';
const granteeAddress = 'cosmos1v0uhfgla2fcfr4zkf02sct6m33fxjt3rru4uks';
const granterAddress = 'cosmos19ufnry44q92kn0cu9uj788qqayv2ty39ve6x29';
const validators = ['cosmosvaloper1q6d3d089hg59x6gcx92uumx70s5y5wadklue8s'];

console.log('Starting script... ✨');

console.log('Grantee address >>> ', granteeAddress);
console.log('Granter address >>> ', granterAddress);
console.log('Validator list address >>> ', validators);

const defaultConverters: AminoConverters = {
  ...createBankAminoConverters(),
  ...createDistributionAminoConverters(),
  ...createFeegrantAminoConverters(),
  ...createGovAminoConverters(),
  ...createIbcAminoConverters(),
  ...createStakingAminoConverters(),
};

const converters: AminoConverters = {
  ...defaultConverters,
  ...createCustomAuthzConverters()
}

const registry = new Registry([
  ...defaultRegistryTypes,
]);

const aminoTypes = new AminoTypes({
  ...converters,
});

const createSigningClient = async () => {
  const offlineSigner = await getOfflineSignerAmino({
    mnemonic: mnemo,
    chain: {
      bech32_prefix: 'cosmos',
      slip44: 118,
    }
  });


  if (!offlineSigner) {
    return Promise.reject(new Error('Offline signer not available'));
  }

  const rpcEndpoint = 'https://rpc.cosmos.directory/cosmoshub';

  return SigningStargateClient.connectWithSigner(rpcEndpoint, offlineSigner, {
    registry,
    aminoTypes,
  });
}

const createMsgs = (address: string) => {
  // Staking
  const stakingMsg = buildGrantMsgForStaking(granterAddress, granteeAddress, validators);

  // Transfer
  const transferMsg = buildGrantMsgForTransfers(granterAddress, granteeAddress);

  // Fee
  const feeMSg = buildGrantMsgForFee(granterAddress, granteeAddress);

  return [stakingMsg];
}

const signAndBroadcastTx = async () => {
  try {
    const client = await createSigningClient();
    const msgs = createMsgs(granteeAddress);
    const gasFee: StdFee = {
      amount: [
        {
          denom: 'uatom', // Replace 'uatom' with the appropriate token denom for your chain
          amount: '5000', // Adjust this value based on chain's gas price
        },
      ],
      gas: '200000', // Medium gas limit
    };

    // @ts-ignore
    const signed = await client.sign(
      granterAddress,
      msgs,
      gasFee,
      ''
    );

    const broadcastRes = await client.broadcastTx(
      Uint8Array.from(TxRaw.encode(signed).finish())
    );

    if (isDeliverTxSuccess(broadcastRes)) {

    } else {
      console.error('Transaction failed >>', broadcastRes.rawLog)
      new Error('Transaction failed', );
    }


  } catch (e) {
    console.error('Error during script run', e);
  } finally {
    console.log('Script finished... ✨');
  }
};


const run = async () => {
  await signAndBroadcastTx();
}

run();
