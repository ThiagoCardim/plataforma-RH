"use client";
import { useState } from "react";
import { type Scope } from "../career/model";
import { useLocalDemo } from "../local-demo/use-local-demo";
import {
  type CultureState,
  type Receipt,
  projection,
  confirmReading,
} from "./model";
export function useCulture(initial: CultureState, scope: Scope) {
  const local = useLocalDemo(`culture-v1:${scope.key}`, initial, (s) =>
      projection(s, scope),
    ),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  function act(
    fn: (s: CultureState) => CultureState,
    message = "Alteração salva somente neste navegador.",
  ) {
    try {
      local.setValue(fn(local.value));
      setNotice(message);
      setError("");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  return {
    ...local,
    state: local.value,
    notice,
    error: error || local.error,
    act,
  };
}
export function useCultureReading(state: CultureState, scope: Scope) {
  const local = useLocalDemo<Receipt[]>(
      `culture-reading-v1:${scope.key}`,
      [],
      (rows) =>
        rows.filter((r) => r.org === scope.org && r.user === scope.user),
    ),
    [error, setError] = useState("");
  function confirm(source: Receipt["source"], expectedManualId: string) {
    try {
      local.setValue(
        confirmReading(state, scope, local.value, source, expectedManualId),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return { ...local, error: error || local.error, confirm };
}
