export const formatString = (str: string, start: number, end: number) => {
  return str.slice(0, start) + "..." + str.slice(-end);
};
