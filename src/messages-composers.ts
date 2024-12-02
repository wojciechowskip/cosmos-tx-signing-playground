
import { coin } from '@cosmjs/stargate';
import dayjs from 'dayjs';
import { MessageComposer as AuthzMessageComposer } from 'cosmos-js-telescope/cosmos/authz/v1beta1/tx.registry';
import { MessageComposer as FeeGrantMessageComposer } from 'cosmos-js-telescope/cosmos/feegrant/v1beta1/tx.registry';
import { Grant } from 'cosmos-js-telescope/cosmos/authz/v1beta1/authz';
import { SendAuthorization } from 'cosmos-js-telescope/cosmos/bank/v1beta1/authz';
import {
  AuthorizationType,
  StakeAuthorization,
  StakeAuthorization_Validators,
} from 'cosmos-js-telescope/cosmos/staking/v1beta1/authz';
import { AllowedMsgAllowance, BasicAllowance } from 'cosmos-js-telescope/cosmos/feegrant/v1beta1/feegrant';
import { MsgDelegate } from 'cosmos-js-telescope/cosmos/staking/v1beta1/tx';
import { Any } from 'cosmos-js-telescope/google/protobuf/any';

const chainType = 'COSMOS';

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
  'ETHEREUM',
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
          address: [""],
          type: "cosmos-sdk/StakeAuthorization/AllowList",
        }),
        maxTokens: null as any,
      }),
      expiration: null as any,
    }),
  });

  console.log(grant);

  return grant;
};

export const buildGrantMsgForTransfers = (
  granterAddress: string,
  granteeAddress: string,
) => {
  const expiredDate = getExpirationDate();
  const spendLimit = formatCompoundSpendLimit(
    chainType
  );

  const grant = AuthzMessageComposer.fromPartial.grant({
    grantee: granteeAddress,
    granter: granterAddress,
    grant: Grant.fromPartial({
      authorization: SendAuthorization.fromPartial({
        spendLimit: [spendLimit],
        allowList: [""], // The list MUST contain a value, otherwise the signed message and the message decoded by the server won't match as the field gets omitted
      }),
      expiration: new Date(expiredDate.getDate()),
    }),
  });

  return grant;
};

export const buildGrantMsgForFee = (granterAddress: string, granteeAddress: string) => {
  const expiredDate = getExpirationDate();

  const feegrant = FeeGrantMessageComposer.fromPartial.grantAllowance({
    granter: granterAddress,
    grantee: granteeAddress,
    allowance: AllowedMsgAllowance.fromPartial({
      allowance: BasicAllowance.fromPartial({
        spendLimit: [{ denom: "uatom", amount: "1000" }],
        expiration: null as any,
      }),
      allowedMessages: ["/cosmos.bank.v1beta1.MsgSend"],
    }),
  });

  return feegrant;
};

export const buildExecDelegateMsg = (
  granterAddress: string, granteeAddress: string, validatorAddress: string
) => {
  const msgDelegateBack = MsgDelegate.fromPartial({
    delegatorAddress: granterAddress,
    validatorAddress: validatorAddress,
    amount: { denom: "uatom", amount: "10" },
  });

  const encodedMsgDelegate = Any.fromPartial({
    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
    value: MsgDelegate.encode(msgDelegateBack).finish(),
  });

  const msgExec = AuthzMessageComposer.fromPartial.exec({
    grantee: granteeAddress,
    msgs: [encodedMsgDelegate],
  });

  return msgExec;
}

export const buildRevokeMsgForStaking = (
  granterAddress: string, granteeAddress: string
) => {

  return AuthzMessageComposer.fromPartial.revoke({
    granter: granterAddress,
    grantee: granteeAddress,
    msgTypeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
  });
}
