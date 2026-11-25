"use client";
import { useState } from "react";
import { type Scope, admin } from "../career/model";
import { useLocalDemo } from "../local-demo/use-local-demo";
import {
  type PerformanceState,
  projection,
  materialize,
  ensureSeason,
  hallProjection,
} from "./model";
export function usePerformance(
  initial: PerformanceState,
  scope: Scope,
  hall = false,
) {
  const local = useLocalDemo(
    `${hall && !admin(scope) ? "published-hall-v1" : "performance-hall-v1"}:${scope.key}`,
    initial,
    (s) =>
      materialize(
        ensureSeason(hall ? hallProjection(s, scope) : projection(s, scope)),
      ),
  );
  const [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  function act(
    fn: (s: PerformanceState) => PerformanceState,
    message = "Alteração demonstrativa salva neste navegador.",
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
    clear: () => {
      setNotice("");
      setError("");
    },
  };
}
