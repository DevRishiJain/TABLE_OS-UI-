/**
 * Formats integer minor units (paise in INR) into formatted currency.
 * Rule: The backend is the sole financial authority.
 * Never use floating-point math to modify or calculate financial balances.
 * 
 * Example: formatMoney(36000) -> "₹360.00"
 */
export function formatMoney(
  amountMinorUnits: number | null | undefined,
  currency: string = "INR",
  includeDecimals: boolean = true
): string {
  if (amountMinorUnits === null || amountMinorUnits === undefined || isNaN(amountMinorUnits)) {
    return currency === "INR" ? "₹0.00" : "0.00";
  }

  const isNegative = amountMinorUnits < 0;
  const absMinor = Math.abs(Math.round(amountMinorUnits));

  const major = Math.floor(absMinor / 100);
  const minor = absMinor % 100;
  const minorStr = minor.toString().padStart(2, "0");

  // Format with Indian numbering grouping (e.g., 1,00,000)
  const majorFormatted = new Intl.NumberFormat("en-IN").format(major);

  const sign = isNegative ? "-" : "";
  const symbol = currency === "INR" ? "₹" : `${currency} `;

  if (!includeDecimals && minor === 0) {
    return `${sign}${symbol}${majorFormatted}`;
  }

  return `${sign}${symbol}${majorFormatted}.${minorStr}`;
}

/**
 * Converts minor units to formatted rupees string without symbol.
 */
export function formatMinorAmount(amountMinorUnits: number): string {
  const major = Math.floor(amountMinorUnits / 100);
  const minor = amountMinorUnits % 100;
  return `${major}.${minor.toString().padStart(2, "0")}`;
}

/**
 * Converts whole or decimal rupees string safely to integer minor units (paise).
 * Uses string manipulation to avoid floating-point inaccuracies.
 */
export function rupeesToMinorUnits(rupeesStr: string | number): number {
  const clean = rupeesStr.toString().trim();
  if (!clean) return 0;
  const parts = clean.split(".");
  const major = parseInt(parts[0], 10) || 0;
  const minorPart = parts[1] || "";
  const minor = parseInt(minorPart.padEnd(2, "0").slice(0, 2), 10) || 0;
  return major * 100 + minor;
}
