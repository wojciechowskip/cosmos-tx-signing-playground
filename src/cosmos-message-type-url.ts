const COSMOS_MESSAGE_TYPE_URL = {
  SEND: '/cosmos.bank.v1beta1.MsgSend',
  EXEC: '/cosmos.authz.v1beta1.MsgExec',
  GRANT: '/cosmos.authz.v1beta1.MsgGrant',
  REVOKE: '/cosmos.authz.v1beta1.MsgRevoke',
  DELEGATE: '/cosmos.staking.v1beta1.MsgDelegate',
  UNDELEGATE: '/cosmos.staking.v1beta1.MsgUndelegate',
  BASIC_ALLOWANCE: '/cosmos.feegrant.v1beta1.BasicAllowance',
  SEND_AUTHORIZATION: '/cosmos.bank.v1beta1.SendAuthorization',
  GRANT_ALLOWANCE: '/cosmos.feegrant.v1beta1.MsgGrantAllowance',
  BEGIN_REDELEGATE: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
  REVOKE_ALLOWANCE: '/cosmos.feegrant.v1beta1.MsgRevokeAllowance',
  STAKE_AUTHORIZATION: '/cosmos.staking.v1beta1.StakeAuthorization',
  GENERIC_AUTHORIZATION: '/cosmos.authz.v1beta1.GenericAuthorization',
  CANCEL_UNBONDING_DELEGATION:
    '/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation',
  WITHDRAW_DELEGATOR_REWARD:
    '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
};

export default COSMOS_MESSAGE_TYPE_URL;
