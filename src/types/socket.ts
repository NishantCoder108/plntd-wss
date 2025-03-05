export interface TradeData {
  price: number;
  timestamp: number;
  type: "buy" | "sell";
  amount: number;
}

export interface ChartData {
  prices: number[];
  timestamps: number[];
}
