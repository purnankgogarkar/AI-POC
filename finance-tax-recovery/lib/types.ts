export const LINE_ITEM_TYPES = ["Material", "Equipment"] as const;
export type LineItemType = (typeof LINE_ITEM_TYPES)[number];

export const LINE_STATUSES = ["Match", "Recovery Candidate", "Underpayment Flag", "Needs Review"] as const;
export type LineStatus = (typeof LINE_STATUSES)[number];

export interface JurisdictionBreakdown {
  state: string;
  stateRate: number;
  county: string;
  countyRate: number;
  city: string;
  cityRate: number;
  specialDistrict: string;
  specialDistrictRate: number;
  combinedRate: number;
  ambiguous: boolean;
  ambiguousReason?: string;
}

export interface LineItem {
  id: string;
  description: string;
  type: LineItemType;
  classificationConfidence: number;
  amount: number;
  appliedTaxRate: number;
  appliedTax: number;
  expectedTaxRate: number;
  expectedTax: number;
  variance: number;
  extractionConfidence: number;
  status: LineStatus;
  reviewReason?: string;
}

export const INVOICE_STATUSES = ["Passed", "Recovery Candidate", "Underpayment Flag", "Needs Review"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  invoiceDate: string;
  address: Address;
  jurisdiction: JurisdictionBreakdown;
  lineItems: LineItem[];
  status: InvoiceStatus;
  totalAmount: number;
  totalApplied: number;
  totalExpected: number;
  recoveryAmount: number;
  exposureAmount: number;
}
