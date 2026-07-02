import type { Region, RegionKey, Side, BodyView } from "./types";

export const TAXONOMY_VERSION = "1.1.0";

// Extensible registry. Add rows here and bump TAXONOMY_VERSION on changes.
export const REGIONS: Region[] = [
  { id: "head", label: "Head", group: "head_neck", bilateral: false, views: ["anterior", "posterior"] },
  { id: "neck", label: "Neck", group: "head_neck", bilateral: false, views: ["anterior", "posterior"] },

  { id: "chest", label: "Chest", group: "trunk", bilateral: false, views: ["anterior"] },
  { id: "abdomen", label: "Abdomen", group: "trunk", bilateral: false, views: ["anterior"] },
  { id: "pelvis", label: "Pelvis", group: "trunk", bilateral: false, views: ["anterior"] },
  { id: "upper_back", label: "Upper Back", group: "trunk", bilateral: false, views: ["posterior"] },
  { id: "lower_back", label: "Lower Back", group: "trunk", bilateral: false, views: ["posterior"] },
  { id: "glutes", label: "Glutes", group: "trunk", bilateral: false, views: ["posterior"] },

  { id: "shoulder", label: "Shoulder", group: "upper_limb", bilateral: true, views: ["anterior", "posterior"] },
  { id: "upper_arm", label: "Upper Arm", group: "upper_limb", bilateral: true, views: ["anterior", "posterior"] },
  { id: "forearm", label: "Forearm", group: "upper_limb", bilateral: true, views: ["anterior", "posterior"] },
  { id: "hand", label: "Hand", group: "upper_limb", bilateral: true, views: ["anterior", "posterior"] },

  { id: "thigh", label: "Thigh", group: "lower_limb", bilateral: true, views: ["anterior", "posterior"] },
  { id: "knee", label: "Knee", group: "lower_limb", bilateral: true, views: ["anterior"] },
  { id: "shin", label: "Shin", group: "lower_limb", bilateral: true, views: ["anterior"] },
  { id: "calf", label: "Calf", group: "lower_limb", bilateral: true, views: ["posterior"] },
  { id: "foot", label: "Foot", group: "lower_limb", bilateral: true, views: ["anterior", "posterior"] },
];

export const getRegion = (id: string): Region | undefined =>
  REGIONS.find((r) => r.id === id);

export const regionKey = (loc: { regionId: string; side: Side; view: BodyView }): RegionKey =>
  `${loc.regionId}:${loc.side}:${loc.view}`;
