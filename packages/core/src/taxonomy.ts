import type { Region, RegionKey, Side, BodyView } from "./types";

export const TAXONOMY_VERSION = "1.0.0";

// Starter set. Extensible: add rows here, bump TAXONOMY_VERSION on changes.
export const REGIONS: Region[] = [
  { id: "head", label: "Head", group: "head_neck", bilateral: false, views: ["anterior", "posterior"] },
  { id: "neck", label: "Neck", group: "head_neck", bilateral: false, views: ["anterior", "posterior"] },
  { id: "chest", label: "Chest", group: "trunk", bilateral: false, views: ["anterior"] },
  { id: "abdomen", label: "Abdomen", group: "trunk", bilateral: false, views: ["anterior"] },
  { id: "lower_back", label: "Lower Back", group: "trunk", bilateral: false, views: ["posterior"] },
  { id: "shoulder", label: "Shoulder", group: "upper_limb", bilateral: true, views: ["anterior", "posterior"] },
  { id: "knee", label: "Knee", group: "lower_limb", bilateral: true, views: ["anterior"] },
];

export const getRegion = (id: string): Region | undefined =>
  REGIONS.find((r) => r.id === id);

export const regionKey = (loc: { regionId: string; side: Side; view: BodyView }): RegionKey =>
  `${loc.regionId}:${loc.side}:${loc.view}`;
