export const getDefaultGasFee = (denom: string) => {
  return {
    amount: [
      {
        denom: denom, // Replace 'uatom' with the appropriate token denom for your chain
        amount: '5000', // Adjust this value based on chain's gas price
      },
    ],
    gas: '500000', // Medium gas limit
  };
}
