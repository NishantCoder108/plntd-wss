export function parseTransaction(transaction: string) {
  const regex = /([A-Za-z0-9]+) transferred ([0-9.]+) (\w+) to ([A-Za-z0-9]+)/;
  const match = transaction.match(regex);

  if (!match) return null;

  const [_, sender, amount, tokenOrSOL, recipient] = match;

  const token = tokenOrSOL === "SOL" ? "SOL" : tokenOrSOL;

  return { sender, amount: parseFloat(amount), token, recipient };

  /* Example usage:
const tx1 = "384q5YbqLqo97avjzqh4KMoXG9zddJ7iyBhctGSHMvAh transferred 0.01 SOL to HiMmuCbieNgDNFd9GbcbVSHYPGPuEgZWwQxJULaJVoVs.";
const tx2 = "HiMmuCbieNgDNFd9GbcbVSHYPGPuEgZWwQxJULaJVoVs transferred 0.02 4Y6b5WNNaEn2R3p3PJM94c5KLWNbBaZeirisfifPCZ3p to 384q5YbqLqo97avjzqh4KMoXG9zddJ7iyBhctGSHMvAh.";

{
  sender: '384q5YbqLqo97avjzqh4KMoXG9zddJ7iyBhctGSHMvAh',
  amount: 0.01,
  token: 'SOL',
  recipient: 'HiMmuCbieNgDNFd9GbcbVSHYPGPuEgZWwQxJULaJVoVs'
}
*/
}
