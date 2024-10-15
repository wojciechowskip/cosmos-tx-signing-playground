import COSMOS_MESSAGE_TYPE_URL from './cosmos-message-type-url';
import { MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { Grant } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import {
  AuthorizationType,
  StakeAuthorization,
  StakeAuthorization_Validators,
} from 'cosmjs-types/cosmos/staking/v1beta1/authz';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz';
import { BasicAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/feegrant';
import { MsgGrantAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/tx';
import { coin } from '@cosmjs/stargate';
import dayjs from 'dayjs';

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

  return BigInt(futureDate.unix());
};

export const buildGrantMsgForStaking = (
  granterAddress: string,
  granteeAddress: string,
  validatorAddresses: string[],
) => {
  const expiredDateInS = getExpirationDate();

  const maxTokens = formatCompoundSpendLimit(
    chainType
  );

  return {
    typeUrl: COSMOS_MESSAGE_TYPE_URL.GRANT,
    value: MsgGrant.fromPartial({
      granter: granterAddress,
      grantee: granteeAddress,
      grant: Grant.fromPartial({
        expiration: {
          seconds: expiredDateInS,
        },
        authorization: {
          typeUrl: COSMOS_MESSAGE_TYPE_URL.STAKE_AUTHORIZATION,
          value: StakeAuthorization.encode(
            StakeAuthorization.fromPartial({
              maxTokens,
              authorizationType: AuthorizationType.AUTHORIZATION_TYPE_DELEGATE,
              allowList: StakeAuthorization_Validators.fromPartial({
                address: validatorAddresses,
              }),
            })
          ).finish(),
        },
      }),
    }),
  };
};

export const buildGrantMsgForTransfers = (
  granterAddress: string,
  granteeAddress: string,
) => {
  const expiredDateInS = getExpirationDate();

  const spendLimit = formatCompoundSpendLimit(
    chainType
  );

  const authorizationValue: {
    spendLimit: Coin[];
    allowList?: string[];
  } = {
    spendLimit: [spendLimit],
  };

  if (chainType === 'COSMOS') {
    authorizationValue.allowList = [granteeAddress];
  }

  return {
    typeUrl: COSMOS_MESSAGE_TYPE_URL.GRANT,
    value: MsgGrant.fromPartial({
      granter: granterAddress,
      grantee: granteeAddress,
      grant: Grant.fromPartial({
        expiration: {
          seconds: expiredDateInS,
        },
        authorization: {
          typeUrl: COSMOS_MESSAGE_TYPE_URL.SEND_AUTHORIZATION,
          value: SendAuthorization.encode(
            SendAuthorization.fromPartial(authorizationValue)
          ).finish(),
        },
      }),
    }),
  };
};

export const buildGrantMsgForFee = (granterAddress: string, granteeAddress: string) => {
  const expiredDateInS = getExpirationDate();

  return {
    typeUrl: COSMOS_MESSAGE_TYPE_URL.GRANT_ALLOWANCE,
    value: MsgGrantAllowance.fromPartial({
      granter: granterAddress,
      grantee: granteeAddress,
      allowance: {
        typeUrl: COSMOS_MESSAGE_TYPE_URL.BASIC_ALLOWANCE,
        value: BasicAllowance.encode(
          BasicAllowance.fromPartial({
            spendLimit: [getGrantsAmount(chainType)],
            expiration: {
              seconds: expiredDateInS,
            },
          })
        ).finish(),
      },
    }),
  };
};
