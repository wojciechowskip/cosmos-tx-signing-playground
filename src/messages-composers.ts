import { coin } from '@cosmjs/stargate';
import dayjs from 'dayjs';
import { MessageComposer as AuthzMessageComposer } from 'cosmos-js-telescope/cosmos/authz/v1beta1/tx.registry';
import { MessageComposer as FeeGrantMessageComposer } from 'cosmos-js-telescope/cosmos/feegrant/v1beta1/tx.registry';

import { GenericAuthorization, Grant } from 'cosmos-js-telescope/cosmos/authz/v1beta1/authz';
import { SendAuthorization } from 'cosmos-js-telescope/cosmos/bank/v1beta1/authz';
import {
  AuthorizationType,
  StakeAuthorization,
  StakeAuthorization_Validators,
} from 'cosmos-js-telescope/cosmos/staking/v1beta1/authz';
import { BasicAllowance } from 'cosmos-js-telescope/cosmos/feegrant/v1beta1/feegrant';
import { MsgDelegate, MsgBeginRedelegate } from 'cosmos-js-telescope/cosmos/staking/v1beta1/tx';
import { Any } from 'cosmos-js-telescope/google/protobuf/any';
import { MsgClaimRewards, MsgRedelegate } from 'cosmos-js-telescope/lavanet/lava/dualstaking/tx';
import { MsgSend } from 'cosmos-js-telescope/cosmos/bank/v1beta1/tx';
import { MsgExec } from 'cosmos-js-telescope/cosmos/authz/v1beta1/tx';
import { Coin } from 'cosmos-js-telescope/cosmos/base/v1beta1/coin';

const chainType = 'LAVA';

export enum ChainId {
  COSMOS = 'cosmoshub-4',
  SECRET = 'secret-4',
  LAVA = 'lava-mainnet-1',
}

export enum ChainDenom {
  COSMOS = 'uatom',
  SECRET = 'uscrt',
  LAVA = 'ulava',
}

export const CosmosChainTypeOptions = ['SECRET', 'COSMOS', 'LAVA'] as const;
export type CosmosChainType = (typeof CosmosChainTypeOptions)[number];
export const ChainTypeOptions = [
  ...CosmosChainTypeOptions,
] as const;

export const getGrantsAmount = (chainType: CosmosChainType) =>
  coin('1000000000000', ChainDenom[chainType]);

const formatCompoundSpendLimit = (chainType: CosmosChainType) =>
  coin('1000000000000', ChainDenom[chainType]);

const getExpirationDate = () => {
  const now = dayjs();

  const yearsToAdd = 3;
  const daysToAdd = 1;

  const futureDate = now.add(yearsToAdd, 'year').add(daysToAdd, 'day');
  return futureDate.toDate();
};


export const buildGrantMsgForStaking = (
  granterAddress: string,
  granteeAddress: string,
) => {
  const grant = AuthzMessageComposer.fromPartial.grant({
    grantee: granteeAddress,
    granter: granterAddress,
    grant: Grant.fromPartial({
      authorization: StakeAuthorization.fromPartial({
        authorizationType: AuthorizationType.AUTHORIZATION_TYPE_DELEGATE,
        allowList: StakeAuthorization_Validators.fromPartial({
          address: [''],
          type: 'cosmos-sdk/StakeAuthorization/AllowList',
        }),
        maxTokens: null as any,
      }),
      expiration: null as any,
    }),
  });

  return grant;
};

export const buildCockyTxToDoOptimizationDelegate = (
  granterAddress: string,
  granteeAddress: string,
) => {
  return AuthzMessageComposer.fromPartial.grant({
    grantee: granteeAddress,
    granter: granterAddress,
    grant: Grant.fromPartial({
      authorization: GenericAuthorization.fromPartial({
        msg: '/cosmos.staking.v1beta1.MsgDelegate', // Change to desired message type
      }),
      expiration: null as any,
    }),
  });
};

export const buildCockyTxToDoOptimizationReDelegate = (
  granterAddress: string,
  granteeAddress: string,
) => {
  return AuthzMessageComposer.fromPartial.grant({
    grantee: granteeAddress,
    granter: granterAddress,
    grant: Grant.fromPartial({
      authorization: GenericAuthorization.fromPartial({
        msg: '/cosmos.staking.v1beta1.MsgBeginRedelegate', // Using redelegation message type
      }),
      expiration: null as any,
    }),
  });
};

export const buildGrantMsgForProviderCompound = (
  granterAddress: string,
  granteeAddress: string,
) => {
  return AuthzMessageComposer.fromPartial.grant({
    grantee: granteeAddress,
    granter: granterAddress,
    grant: Grant.fromPartial({
      authorization: GenericAuthorization.fromPartial({
        msg: '/lavanet.lava.dualstaking.MsgRedelegate',
      }),
    }),
  });
};

export const buildGrantMsgForProviderRwrdClaim = (
  granterAddress: string,
  granteeAddress: string,
) => {
  return AuthzMessageComposer.fromPartial.grant({
    grantee: granteeAddress,
    granter: granterAddress,
    grant: Grant.fromPartial({
      authorization: GenericAuthorization.fromPartial({
        msg: '/lavanet.lava.dualstaking.MsgClaimRewards',
      }),
    }),
  });
};

export const buildLavaCompound = (
  granterAddress: string,
  granteeAddress: string,
) => {
  const msgDelegateBack = MsgRedelegate.fromPartial({
    fromChainID: '*',
    toChainID: '*',
    creator: granterAddress,
    toProvider: 'lava@1t55ssmcjdz49p9ae8kmgxc06llqn2vnc9942tg',
    fromProvider: 'empty_provider',
    amount: { denom: 'ulava', amount: '10' },
  });

  const encodedMsgDelegate = Any.fromPartial({
    typeUrl: '/lavanet.lava.dualstaking.MsgRedelegate',
    value: MsgRedelegate.encode(msgDelegateBack).finish(),
  });

  const msgExec = AuthzMessageComposer.fromPartial.exec({
    grantee: granteeAddress,
    msgs: [encodedMsgDelegate],
  });

  return msgExec;
};

export const buildProviderRewardClaim = (
  granterAddress: string,
  granteeAddress: string,
) => {
  const msgClaimRwrd = MsgClaimRewards.fromPartial({
    creator: granterAddress,
    provider: 'lava@1t55ssmcjdz49p9ae8kmgxc06llqn2vnc9942tg',
  });

  const encodedMsgClaimRwrd = Any.fromPartial({
    typeUrl: '/lavanet.lava.dualstaking.MsgClaimRewards',
    value: MsgClaimRewards.encode(msgClaimRwrd).finish(),
  });

  const msgExec = AuthzMessageComposer.fromPartial.exec({
    grantee: granteeAddress,
    msgs: [encodedMsgClaimRwrd],
  });

  return msgExec;
};

export const buildGrantMsgForTransfers = (
  granterAddress: string,
  granteeAddress: string,
) => {
  const expiredDate = getExpirationDate();
  const spendLimit = formatCompoundSpendLimit(
    chainType,
  );

  console.log('chainType', chainType);

  const grant = AuthzMessageComposer.fromPartial.grant({
    grantee: granteeAddress,
    granter: granterAddress,
    grant: Grant.fromPartial({
      authorization: SendAuthorization.fromPartial({
        spendLimit: [spendLimit],
        allowList: [granteeAddress], // The list MUST contain a value, otherwise the signed message and the message decoded by the server won't match as the field gets omitted
      }),
      expiration: null as any,
    }),
  });

  return grant;
};

export const buildGrantMsgForFee = (granterAddress: string, granteeAddress: string) => {
  const feegrant = FeeGrantMessageComposer.fromPartial.grantAllowance({
    granter: granterAddress,
    grantee: granteeAddress,
    allowance: BasicAllowance.fromPartial({
      spendLimit: [],
      expiration: null as any,
    }),
  });

  return feegrant;
};

export const buildExecRedelegateMsg = (
  granterAddress: string, granteeAddress: string, from: string, to: string
) => {
  const msgDelegateBack = MsgBeginRedelegate.fromPartial({
    delegatorAddress: granterAddress,
    validatorSrcAddress: from,
    validatorDstAddress: to,
    amount: { denom: 'uatom', amount: '1' }
  });

  const encodedMsgDelegate = Any.fromPartial({
    typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
    value: MsgBeginRedelegate.encode(msgDelegateBack).finish(),
  });

  const msgExec = AuthzMessageComposer.fromPartial.exec({
    grantee: granteeAddress,
    msgs: [encodedMsgDelegate]
  })

  console.log('msgExec', msgExec);

  return msgExec;
}

export const buildExecDelegateMsg = (
  granterAddress: string, granteeAddress: string, validatorAddress: string,
) => {
  const msgDelegateBack = MsgDelegate.fromPartial({
    delegatorAddress: granterAddress,
    validatorAddress: validatorAddress,
    amount: { denom: 'uatom', amount: '10' },
  });

  console.log('msgDelegateBack', msgDelegateBack);


  const encodedMsgDelegate = Any.fromPartial({
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: MsgDelegate.encode(msgDelegateBack).finish(),
  });

  const msgExec = AuthzMessageComposer.fromPartial.exec({
    grantee: granteeAddress,
    msgs: [encodedMsgDelegate]
  })

  console.log('msgExec', msgExec);

  return msgExec;
};

export const buildTransferExecMsg = (
  granter: string, grantee: string,
) => {
  const msgTransfer = {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: MsgSend.encode(
      MsgSend.fromPartial({
        fromAddress: granter,
        toAddress: grantee,
        amount: [
          { denom: 'ulava', amount: '1' },
        ],
      }),
    ).finish(),
  };

  const msgExec = AuthzMessageComposer.fromPartial.exec({
    grantee: grantee,
    msgs: [msgTransfer],
  });

  return msgExec;
};

export const buildRevokeMsgForStaking = (
  granterAddress: string, granteeAddress: string,
) => {

  return AuthzMessageComposer.fromPartial.revoke({
    granter: granterAddress,
    grantee: granteeAddress,
    msgTypeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
  });
};
