import { hc } from "hono/client";
import type { AppType } from "@mbg/api";

/** Typed Hono RPC client sharing AppType with apps/api. */
export const api = hc<AppType>("/");
