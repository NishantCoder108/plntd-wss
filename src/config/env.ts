export const stakingPoolWallet = process.env.PUBLICKEY as string;
export const privateKey = process.env.PRIVATEKEY as string;
export const RPC_URL = process.env.RPCURL || "https://api.devnet.solana.com";
export const MINT_TOKEN_ADDRESS = process.env.MINT_TOKEN_ADDRESS as string;
export const ATA_ADDRESS = process.env.ATA_ADDRESS as string;
export const AUTH_WEBHOOK_HEADERS = process.env.AUTH_WEBHOOK_HEADERS as string;
export const MONGO_URI = process.env.MONGO_URI as string;
export const PORT = process.env.PORT || 3000;
