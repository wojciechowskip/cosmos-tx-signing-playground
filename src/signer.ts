import { Slip10RawIndex } from '@cosmjs/crypto';
import { Secp256k1HdWallet, Secp256k1Wallet } from '@cosmjs/amino';
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { chains } from 'chain-registry';
import { SigningStargateClient } from '@cosmjs/stargate';
import { fromHex } from '@cosmjs/encoding';
import { SigningStargateClientOptions } from '@cosmjs/stargate/build/signingstargateclient';
import { HttpBatchClient, Tendermint37Client } from '@cosmjs/tendermint-rpc';

const getTendermint37Client = async (rpcEndpoint: string) => {
  return await Tendermint37Client.create(
    getHttpBatchClient(rpcEndpoint)
  );
}

const getHttpBatchClient = (rpcEndpoint: string) => {
  return new HttpBatchClient(rpcEndpoint, {
    dispatchInterval: 2000,
  });
}

const makeHdPath = (coinType = 118, account = 0) => {
  return [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(coinType),
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(account),
  ];
};

const getOfflineSignerAminoFromMnemonic = async ({ mnemonic, chain }: any): Promise<Secp256k1HdWallet> => {
  try {
    const { bech32_prefix, slip44 } = chain;
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: bech32_prefix,
      hdPaths: [makeHdPath(slip44, 0)],
    });
    return wallet;
  } catch (e) {
    throw new Error('Error while creating offline signer');
  }
};

const getOfflineSignerAminoFromPrivKey = async ({ privKey, chainPrefix }: any): Promise<Secp256k1Wallet> => {
  try {
    const wallet = await Secp256k1Wallet.fromKey(fromHex(privKey), chainPrefix);
    return wallet;
  } catch (e) {
    throw new Error('Error while creating offline signer');
  }
};

const getOfflineSignerProtoFromPrivKey = async ({ privKey, chainPrefix }: any): Promise<DirectSecp256k1Wallet> => {
  try {
    const wallet = await DirectSecp256k1Wallet.fromKey(fromHex(privKey), chainPrefix);
    return wallet;
  } catch (e) {
    console.log('e', e);
    throw new Error('Error while creating offline signer');
  }
};

const getOfflineSignerProtoFromMnemonic = async ({ mnemonic, chain }: any): Promise<DirectSecp256k1HdWallet> => {
  try {
    const { bech32_prefix, slip44 } = chain;
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: bech32_prefix,
      hdPaths: [makeHdPath(slip44, 0)],
    });
    console.log('wallet', wallet);
    return wallet;
  } catch (e) {
    console.log('e', e);
    throw new Error('Error while creating offline signer');
  }
};

export const createSigningClient = async (amino: boolean, {
  privKey, memo,
}: { privKey?: string, memo?: string }, rpcEndpoint: string, signingOptions: SigningStargateClientOptions, chainName: string) => {
  if (privKey && memo) {
    throw new Error('Both memo and priv key found, use only one!');
  } else if (!privKey && !memo) {
    throw new Error('Priv key and memo not found, pass at least one!');
  }

  let offlineSigner = null;

  const useMemo = memo && !privKey;

  const chain = chains.find(({ chain_name }) => chain_name === chainName);

  console.log('chain', chain)

  if (amino) {
    if (useMemo) {
      offlineSigner = await getOfflineSignerAminoFromMnemonic({
        mnemonic: memo,
        chain,
      });
    } else {
      offlineSigner = await getOfflineSignerAminoFromPrivKey({
        privKey: privKey,
        chainPrefix: chain?.bech32_prefix || 'kii'
      });
    }
  } else {
    if (useMemo) {
      offlineSigner = await getOfflineSignerProtoFromMnemonic({
        mnemonic: memo,
        chain,
      });
    } else {
      offlineSigner = await getOfflineSignerProtoFromPrivKey({
        privKey: privKey,
        chainPrefix: chain?.bech32_prefix || 'kii'
      });
    }
  }

  if (!offlineSigner) {
    return Promise.reject(new Error('Offline signer not available'));
  }

  const tendermintRpc = await getTendermint37Client(rpcEndpoint);

  return SigningStargateClient.createWithSigner(tendermintRpc as any, offlineSigner, {
    ...signingOptions,
  });
};
