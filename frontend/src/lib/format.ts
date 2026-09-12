import { formatUnits } from "viem";

// Arc Testnet exposes native USDC with 18 decimal places.
export const USDC_DECIMALS = 18;

export function formatUsdcDisplay(value: number, maximumFractionDigits = 2): string {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })} USDC`;
}

export function formatUsdcAmount(value: bigint | number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return 0;
    }

    try {
      return Number(formatUnits(BigInt(trimmed), USDC_DECIMALS));
    } catch {
      return 0;
    }
  }

  try {
    return Number(formatUnits(value, USDC_DECIMALS));
  } catch {
    return 0;
  }
}
