import type { Address, JurisdictionBreakdown, LineItemType } from "@/lib/types";

/**
 * Illustrative Denver, CO combined sales-tax rate table for this prototype's
 * MVP jurisdiction scope (state + city/county + special district), applied
 * uniformly to Material and Equipment line items — the two starting
 * line-item types. Freight and services attract different treatment and are
 * out of scope for this MVP.
 *
 * These figures are for demonstration only — NOT verified, current tax
 * rates. A real deployment must source rates from an authoritative,
 * maintained table (customer-supplied or a licensed tax-rate service).
 */
export const DENVER_RATES = {
  state: "Colorado",
  stateRate: 0.029,
  county: "City & County of Denver",
  countyRate: 0.0481,
  city: "Denver",
  cityRate: 0, // Denver is a consolidated city-county; the county rate above covers the municipal layer.
  specialDistrict: "RTD + SCFD special districts",
  specialDistrictRate: 0.011,
} as const;

// A handful of zip codes we treat as "near a special-district boundary" —
// straddling addresses are a known hard case per the brief, and this makes
// that edge case visibly reproducible in the demo data instead of hidden.
const BOUNDARY_ZIPS = new Set(["80219", "80236", "80123"]);

export function resolveJurisdiction(address: Address): JurisdictionBreakdown {
  const ambiguous = BOUNDARY_ZIPS.has(address.zip);
  const combinedRate = DENVER_RATES.stateRate + DENVER_RATES.countyRate + DENVER_RATES.cityRate + DENVER_RATES.specialDistrictRate;

  return {
    state: DENVER_RATES.state,
    stateRate: DENVER_RATES.stateRate,
    county: DENVER_RATES.county,
    countyRate: DENVER_RATES.countyRate,
    city: DENVER_RATES.city,
    cityRate: DENVER_RATES.cityRate,
    specialDistrict: DENVER_RATES.specialDistrict,
    specialDistrictRate: DENVER_RATES.specialDistrictRate,
    combinedRate,
    ambiguous,
    ambiguousReason: ambiguous
      ? "This address sits near a special-district boundary — the district layer is not conclusively resolved from the address alone."
      : undefined,
  };
}

export function expectedTaxFor(_type: LineItemType, amount: number, jurisdiction: JurisdictionBreakdown) {
  const expectedTaxRate = jurisdiction.combinedRate;
  return { expectedTaxRate, expectedTax: Math.round(amount * expectedTaxRate * 100) / 100 };
}
