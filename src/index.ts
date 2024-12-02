import { AminoConverters, AminoTypes, isDeliverTxSuccess, SigningStargateClient, StdFee } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { Secp256k1HdWallet } from '@cosmjs/amino';
import { Slip10RawIndex } from '@cosmjs/crypto';
import {
  TxRaw,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {
  buildExecDelegateMsg,
  buildGrantMsgForFee,
  buildGrantMsgForStaking,
  buildGrantMsgForTransfers,
  buildRevokeMsgForStaking,
} from './messages-composers';
import { cosmosProtoRegistry, cosmosAminoConverters } from 'cosmos-js-telescope';

// do not commit! replace with your own private key
const memo = '';
const granteeAddress = 'cosmos1v0uhfgla2fcfr4zkf02sct6m33fxjt3rru4uks';
const granterAddress = 'cosmos19ufnry44q92kn0cu9uj788qqayv2ty39ve6x29';

// Let's see if empty list works as expected
const emptyValidatorsList = [''];
const validatorsList = ['cosmosvaloper1qje005kmeztf34pec5f6fd35p833ynvagdkqan'];

const rpcEndpoint = 'https://rpc.cosmos.directory/cosmoshub';

console.log('Starting script... ✨');

console.log('Grantee address >>> ', granteeAddress);
console.log('Granter address >>> ', granterAddress);
console.log('Validator list address >>> ', validatorsList);

const converters: AminoConverters = {
  ...cosmosAminoConverters
}

const registry = new Registry([
  ...cosmosProtoRegistry
]);

const aminoTypes = new AminoTypes({
  ...converters
});

const makeHdPath = (coinType = 118, account = 0) => {
  return [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(coinType),
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(account)
  ];
}

const getOfflineSignerAmino = async ({ mnemonic, chain }: any): Promise<Secp256k1HdWallet> => {
  try {
    const { bech32_prefix, slip44 } = chain;
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: bech32_prefix,
      hdPaths: [makeHdPath(slip44, 0)]
    });
    return wallet;
  } catch (e) {
    throw new Error('Error while creating offline signer');
  }
};

const getOfflineSignerProto = async ({ mnemonic, chain }: any): Promise<DirectSecp256k1HdWallet> => {
  try {
    const { bech32_prefix, slip44 } = chain;
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: bech32_prefix,
      hdPaths: [makeHdPath(slip44, 0)]
    });
    return wallet;
  } catch (e) {
    console.log('e', e);
    throw new Error('Error while creating offline signer');
  }
};

const createSigningClient = async (amino: boolean, walletMemo: string) => {
  let offlineSigner = null;

  if (amino) {
    offlineSigner = await getOfflineSignerAmino({
      mnemonic: walletMemo,
      chain: {
        bech32_prefix: 'cosmos',
        slip44: 118,
      }
    });
  } else {
    offlineSigner = await getOfflineSignerProto({
      mnemonic: walletMemo,
      chain: {
        bech32_prefix: 'cosmos',
        slip44: 118,
      }
    });
  }

  if (!offlineSigner) {
    return Promise.reject(new Error('Offline signer not available'));
  }

  return SigningStargateClient.connectWithSigner(rpcEndpoint, offlineSigner, {
    registry,
    aminoTypes,
  });
}

const createMsgs = (address: string) => {
  // Staking
  const stakingMsg = buildGrantMsgForStaking(granterAddress, granteeAddress);

  // Transfer
  const transferMsg = buildGrantMsgForTransfers(granterAddress, granteeAddress);

  // Fee
  const feeMSg = buildGrantMsgForFee(granterAddress, granteeAddress);

  return [stakingMsg];
}

const signAndBroadcastTx = async () => {
  try {
    const client = await createSigningClient(true, memo);
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
