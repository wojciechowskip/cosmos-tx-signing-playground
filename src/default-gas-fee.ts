export const getDefaultGasFee = (denom: string) => {
  return {
    amount: [
      {
        denom: denom, // Replace 'uatom' with the appropriate token denom for your chain
        amount: '10000', // Adjust this value based on chain's gas price
      },
    ],
    gas: '1000000', // Medium gas limit
  };
}
