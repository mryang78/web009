"use client";

import { useSyncExternalStore } from "react";
import { listDApps, subscribeDApps } from "./dapp-directory-engine";
import type { DAppDirectoryEntry } from "./dapp-directory-types";

export function useDAppDirectory(): DAppDirectoryEntry[] {
  return useSyncExternalStore(
    (onChange) => subscribeDApps(onChange),
    () => listDApps(),
    () => listDApps()
  );
}
