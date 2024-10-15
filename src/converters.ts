import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { AminoConverters } from '@cosmjs/stargate/build/aminotypes';
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz';
import { MsgGrantAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/tx';
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import { StakeAuthorization } from 'cosmjs-types/cosmos/staking/v1beta1/authz';
import { BasicAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/feegrant';
import COSMOS_MESSAGE_TYPE_URL from './cosmos-message-type-url';

dayjs.extend(utc);

const createAuthzAuthorizationAminoConverter = (): AminoConverters => {
  return {
    [COSMOS_MESSAGE_TYPE_URL.BASIC_ALLOWANCE]: {
      aminoType: 'cosmos-sdk/BasicAllowance',
      toAmino: (value) => BasicAllowance.decode(value),
      fromAmino: (value) =>
        BasicAllowance.encode(BasicAllowance.fromPartial(value)).finish(),
    },
    [COSMOS_MESSAGE_TYPE_URL.GRANT_ALLOWANCE]: {
      aminoType: 'cosmos-sdk/MsgGrantAllowance',
      toAmino: (value) => MsgGrantAllowance.decode(value),
      fromAmino: (value) =>
        MsgGrantAllowance.encode(MsgGrantAllowance.fromPartial(value)).finish(),
    },
    [COSMOS_MESSAGE_TYPE_URL.GENERIC_AUTHORIZATION]: {
      aminoType: 'cosmos-sdk/GenericAuthorization',
      toAmino: (value) => GenericAuthorization.decode(value),
      fromAmino: ({ msg }) =>
        GenericAuthorization.encode(
          GenericAuthorization.fromPartial({
            msg,
          })
        ).finish(),
    },
    [COSMOS_MESSAGE_TYPE_URL.SEND_AUTHORIZATION]: {
      aminoType: 'cosmos-sdk/SendAuthorization',
      toAmino: (value) => {
        return SendAuthorization.decode(value);
      },
      fromAmino: ({ spendLimit }) =>
        SendAuthorization.encode(
          SendAuthorization.fromPartial({
            spendLimit,
          })
        ).finish(),
    },
    [COSMOS_MESSAGE_TYPE_URL.STAKE_AUTHORIZATION]: {
      aminoType: 'cosmos-sdk/StakeAuthorization',
      fromAmino: ({ allow_list, max_tokens, authorization_type }) =>
        StakeAuthorization.encode(
          StakeAuthorization.fromPartial({
            allowList: allow_list,
            maxTokens: max_tokens,
            authorizationType: authorization_type,
          })
        ).finish(),
      toAmino: (value) => {
        const { allowList, maxTokens, authorizationType } =
          StakeAuthorization.decode(value);
        return {
          max_tokens: maxTokens,
          authorization_type: authorizationType,
          Validators: {
            type: 'cosmos-sdk/StakeAuthorization/AllowList',
            value: {
              allow_list: allowList,
            },
          },
        };
      },
    },
  };
};

const dateConverter = {
  fromAmino: (date: dayjs.ConfigType) => {
    return {
      nanos: 0,
      seconds: dayjs(date).unix(),
    };
  },
  toAmino: (date: { seconds: number | BigInt }) => {
    return dayjs(Number(date.seconds) * 1000)
      .utc()
      .format();
  },
};

export const createCustomAuthzConverters = (): AminoConverters => {
  const grantConverter = createAuthzAuthorizationAminoConverter();
  return {
    [COSMOS_MESSAGE_TYPE_URL.BASIC_ALLOWANCE]: {
      aminoType: 'cosmos-sdk/BasicAllowance',
      toAmino: (value) => {
        return BasicAllowance.decode(value);
      },
      fromAmino: (value) => {
        return BasicAllowance.encode(
          BasicAllowance.fromPartial(value)
        ).finish();
      },
    },
    [COSMOS_MESSAGE_TYPE_URL.GRANT_ALLOWANCE]: {
      aminoType: 'cosmos-sdk/MsgGrantAllowance',
      fromAmino: (value) => {
        return MsgGrantAllowance.encode(
          MsgGrantAllowance.fromPartial(value)
        ).finish();
      },
      toAmino: ({ granter, grantee, allowance }) => {
        const converter = grantConverter[allowance.typeUrl];
        const value = converter.toAmino(allowance.value);

        return {
          granter,
          grantee,
          allowance: {
            typeUrl: converter.aminoType,
            value: {
              ...value,
              expiration: {
                ...value.expiration,
                seconds: Number(value.expiration.seconds),
              },
            },
          },
        };
      },
    },
    [COSMOS_MESSAGE_TYPE_URL.GRANT]: {
      aminoType: 'cosmos-sdk/MsgGrant',
      fromAmino: ({ grant, granter, grantee }) => {
        const protoType = Object.keys(grantConverter).find(
          (type) => grantConverter[type].aminoType === grant.authorization.type
        );
        const converter = protoType ? grantConverter[protoType] : undefined;
        return {
          granter,
          grantee,
          grant: {
            expiration: dateConverter.fromAmino(grant.expiration),
            authorization: {
              typeUrl: protoType,
              value: converter?.fromAmino(grant.authorization.value),
            },
          },
        };
      },
      toAmino: ({ grant, granter, grantee }) => {
        const converter = grantConverter[grant.authorization.typeUrl];
        return {
          granter,
          grantee,
          grant: {
            expiration: dateConverter.toAmino(grant.expiration),
            authorization: {
              type: converter.aminoType,
              value: converter.toAmino(grant.authorization.value),
            },
          },
        };
      },
    },
  };
};
