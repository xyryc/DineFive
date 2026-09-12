export interface RestaurantTaxPart {
  lineReference: "meal" | "platform_fee";
  jurisdiction: { level: string; displayName: string };
  percentage: string | null;
  taxabilityReason: string;
  amount: number;
}

export function formatRestaurantTaxLabel(part: RestaurantTaxPart): string {
  const scope = part.lineReference === "platform_fee" ? "Platform fee" : "Meals";
  const level = part.jurisdiction.level;
  const tax = `${level.charAt(0).toUpperCase()}${level.slice(1)} Tax`;
  const name = part.jurisdiction.displayName;
  const base = `${scope} · ${name ? `${name} ` : ""}${tax}`;
  // Stripe returns percent units, including sub-1% district rates. Preserve
  // precision; never fall back to tax / subtotal or treat missing as zero.
  const percentage = part.percentage;
  const hasRate = typeof percentage === "string" && /^\d+(\.\d+)?$/.test(percentage);
  const rate = hasRate ? ` (${percentage.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1")}%)` : "";
  const reasons: Record<string, string> = {
    customer_exempt: "customer exempt",
    product_exempt: "exempt",
    product_exempt_holiday: "tax holiday",
    not_collecting: "not collected",
    not_subject_to_tax: "not subject to tax",
    reverse_charge: "reverse charge",
  };
  const reason = reasons[part.taxabilityReason];
  return `${base}${rate}${reason ? ` — ${reason}` : ""}`;
}

/**
 * Derives the official state / city(+county+district) rate for display next to
 * "State Tax" / "City Tax" totals — summed straight from Stripe's own per-jurisdiction
 * percentages for the meal line (never tax ÷ subtotal, which overstates the rate
 * because the tax total also includes tax charged on the platform fee line).
 * Returns null for a rate when no trustworthy breakdown is available, rather than
 * guessing — callers should simply omit the percentage in that case.
 */
export function deriveMealTaxRatePercents(
  taxBreakdown: RestaurantTaxPart[] | undefined,
): { statePercent: number | null; cityPercent: number | null } {
  if (!Array.isArray(taxBreakdown) || !taxBreakdown.length) {
    return { statePercent: null, cityPercent: null };
  }

  const mealParts = taxBreakdown.filter(
    part => part.lineReference === "meal" &&
      typeof part.percentage === "string" &&
      /^\d+(\.\d+)?$/.test(part.percentage),
  );
  if (!mealParts.length) return { statePercent: null, cityPercent: null };

  let statePercent = 0;
  let cityPercent = 0;
  let hasState = false;
  let hasCity = false;

  for (const part of mealParts) {
    const value = parseFloat(part.percentage as string);
    if (part.jurisdiction.level === "state") {
      statePercent += value;
      hasState = true;
    } else {
      cityPercent += value;
      hasCity = true;
    }
  }

  return {
    statePercent: hasState ? statePercent : null,
    cityPercent: hasCity ? cityPercent : null,
  };
}

export function restaurantTaxRows(group: {
  taxBreakdown?: RestaurantTaxPart[];
  stateTax: number;
  cityTax: number;
}): { label: string; amount: number }[] {
  if (Array.isArray(group.taxBreakdown) && group.taxBreakdown.length) {
    return group.taxBreakdown.map(part => ({
      label: formatRestaurantTaxLabel(part), amount: part.amount,
    }));
  }
  // Older API responses have no trustworthy jurisdiction metadata.
  return [
    { label: "State Tax", amount: group.stateTax },
    { label: "Local Tax", amount: group.cityTax },
  ];
}
