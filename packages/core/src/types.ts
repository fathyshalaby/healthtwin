export type ULID = string;
export type ISO = string;
export type ID = string;

export type Side = "left" | "right" | "central";
export type BodyView = "anterior" | "posterior";
export type ObservationType =
  | "pain" | "stiffness" | "numbness" | "tingling"
  | "swelling" | "weakness" | "other";
export type Quality =
  | "sharp" | "dull" | "burning" | "throbbing"
  | "aching" | "stabbing" | "cramping";

export interface Location {
  regionId: string;
  side: Side;
  view: BodyView;
  point?: { x: number; y: number };
}

export interface Observation {
  id: ULID;
  subjectId: ID;
  occurredAt: ISO;
  createdAt: ISO;
  location: Location;
  type: ObservationType;
  quality?: Quality[];
  intensity?: number;
  note?: string;
  contextTags?: string[];
  taxonomyVersion: string;
  supersedes?: ULID;
  tombstone?: boolean;
  origin: ID;
}

export interface Region {
  id: string;
  label: string;
  group: "head_neck" | "trunk" | "upper_limb" | "lower_limb";
  bilateral: boolean;
  views: BodyView[];
}

export type RegionKey = string; // `${regionId}:${side}:${view}`
