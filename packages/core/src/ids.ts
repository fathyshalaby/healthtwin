import { ulid } from "ulid";
import type { ULID, ISO } from "./types";

export const newId = (): ULID => ulid();
export const nowISO = (): ISO => new Date().toISOString();
