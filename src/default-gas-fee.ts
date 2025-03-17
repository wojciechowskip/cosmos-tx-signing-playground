export const getDefaultGasFee = (denom: string) => {
  return {
    amount: [
      {
        denom: denom, // Replace 'uatom' with the appropriate token denom for your chain
        amount: '200000', // Adjust this value based on the chain's gas price
      },
    ],
    gas: '10000000', // Updated gas limit to not exceed the block's max gas limit
  };
}
