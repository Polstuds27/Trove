export const BANKS = [
  { name: "BDO Unibank", logo: "bdo-logo.jpg" },
  { name: "BPI (Bank of the Philippine Islands)", logo: "bpi-logo.jfif" },
  { name: "Metrobank", logo: "metrobank-logo.jpg" },
  { name: "Landbank of the Philippines", logo: "landbank-logo.jfif" },
  { name: "PNB (Philippine National Bank)", logo: "pnb-logo.png" },
  { name: "Security Bank", logo: "securitybank-logo.png" },
  { name: "UnionBank", logo: "unionbank-logo.png" },
  { name: "RCBC", logo: "rcbc-logo.jfif" },
  { name: "China Bank", logo: "chinabank-logo.jpg" },
  { name: "EastWest Bank", logo: "eastwest-logo.jpg" },
  { name: "GoTyme Bank", logo: "gotyme-logo.jpg" },
  { name: "Maya e-wallet", logo: "maya-logo.png" },
  { name: "MariBank", logo: "maribank-logo.jfif" },
  { name: "GCash", logo: "gcash-logo.png" },
  { name: "Cash", logo: null },
  { name: "Other bank", logo: null },
] as const;

export function bankByName(name: string | null | undefined) {
  const normalized = name?.trim().toLowerCase();
  return BANKS.find((bank) => bank.name.toLowerCase() === normalized);
}
