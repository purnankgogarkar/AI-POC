import type { FieldSource } from "@/lib/types";

/**
 * The ~30 recurring documents/fields a production package typically
 * bundles. `required: false` means conditional — applicable to some
 * packages, not others. `defaultSource` is what generates the value in the
 * common case: Rule for deterministic/administrative items, AI for
 * extraction-and-interpretation items. A planner (Human) is always the one
 * who resolves an exception, regardless of how the field started out.
 */
export interface RequirementTemplate {
  id: string;
  name: string;
  required: boolean;
  sourceSystem: string;
  defaultSource: FieldSource;
}

export const REQUIREMENT_CATALOG: RequirementTemplate[] = [
  { id: "r01", name: "Material Certification", required: true, sourceSystem: "Engineering Drawings & Specs", defaultSource: "AI" },
  { id: "r02", name: "Mill Test Report", required: true, sourceSystem: "Engineering Drawings & Specs", defaultSource: "AI" },
  { id: "r03", name: "Cut List", required: true, sourceSystem: "Bill of Materials", defaultSource: "AI" },
  { id: "r04", name: "Fabrication Drawing Set", required: true, sourceSystem: "Engineering Drawings & Specs", defaultSource: "Rule" },
  { id: "r05", name: "Weld Procedure Specification (WPS)", required: true, sourceSystem: "Quality Standards Library", defaultSource: "Rule" },
  { id: "r06", name: "Welder Qualification Record", required: true, sourceSystem: "Quality Standards Library", defaultSource: "AI" },
  { id: "r07", name: "Bolt Torque Record", required: false, sourceSystem: "Shop Floor Records", defaultSource: "Human" },
  { id: "r08", name: "Coating / Galvanizing Certificate", required: false, sourceSystem: "Vendor Documentation", defaultSource: "AI" },
  { id: "r09", name: "Non-Destructive Testing (NDT) Report", required: false, sourceSystem: "Quality Standards Library", defaultSource: "AI" },
  { id: "r10", name: "Dimensional Inspection Report", required: true, sourceSystem: "Shop Floor Records", defaultSource: "AI" },
  { id: "r11", name: "Bill of Materials (BOM)", required: true, sourceSystem: "Bill of Materials", defaultSource: "Rule" },
  { id: "r12", name: "Shop Traveler / Router", required: true, sourceSystem: "Production System", defaultSource: "Rule" },
  { id: "r13", name: "Assembly Sequence Drawing", required: true, sourceSystem: "Engineering Drawings & Specs", defaultSource: "AI" },
  { id: "r14", name: "Erection Drawing", required: true, sourceSystem: "Engineering Drawings & Specs", defaultSource: "AI" },
  { id: "r15", name: "Shipping Manifest", required: true, sourceSystem: "Production System", defaultSource: "Rule" },
  { id: "r16", name: "Packing List", required: true, sourceSystem: "Production System", defaultSource: "Rule" },
  { id: "r17", name: "Load List", required: true, sourceSystem: "Production System", defaultSource: "AI" },
  { id: "r18", name: "Crane Pick Plan", required: false, sourceSystem: "Project Tracker (Files/Sheets)", defaultSource: "Human" },
  { id: "r19", name: "Quality Control Checklist", required: true, sourceSystem: "Quality Standards Library", defaultSource: "Rule" },
  { id: "r20", name: "Non-Conformance Report", required: false, sourceSystem: "Shop Floor Records", defaultSource: "Human" },
  { id: "r21", name: "Safety Data Sheet (coatings/consumables)", required: false, sourceSystem: "Vendor Documentation", defaultSource: "Rule" },
  { id: "r22", name: "Field Installation Instructions", required: true, sourceSystem: "Engineering Drawings & Specs", defaultSource: "AI" },
  { id: "r23", name: "Punch List Template", required: true, sourceSystem: "Production System", defaultSource: "Rule" },
  { id: "r24", name: "As-Built Drawing Placeholder", required: false, sourceSystem: "Engineering Drawings & Specs", defaultSource: "Rule" },
  { id: "r25", name: "Material Traceability Log", required: true, sourceSystem: "Bill of Materials", defaultSource: "AI" },
  { id: "r26", name: "Heat Number Log", required: true, sourceSystem: "Shop Floor Records", defaultSource: "AI" },
  { id: "r27", name: "Surface Preparation Record", required: false, sourceSystem: "Shop Floor Records", defaultSource: "Human" },
  { id: "r28", name: "Paint / Coating Inspection Report", required: false, sourceSystem: "Vendor Documentation", defaultSource: "AI" },
  { id: "r29", name: "Job Cost Code Sheet", required: true, sourceSystem: "Enterprise Data Platform", defaultSource: "Rule" },
  { id: "r30", name: "Release for Fabrication Approval Form", required: true, sourceSystem: "Production System", defaultSource: "Human" },
];
