"use client";
import { useState } from "react";
import { type Scope } from "../career/model";
import { useLocalDemo } from "../local-demo/use-local-demo";
import { type State } from "./model";
import { projectWorkflow } from "./workflow-model";
export function useRecruitment(initial: State, scope: Scope) {
  const local = useLocalDemo(`recruitment-v1:${scope.key}`, initial, (s) =>
      projectWorkflow(s, scope),
    ),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  function act(
    fn: (s: State) => State,
    text = "Simulação salva somente neste navegador.",
  ) {
    try {
      const next = fn(local.value);
      local.setValue(next);
      setError("");
      setNotice(text);
      return next;
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    }
  }
  return {
    ...local,
    state: local.value,
    error: error || local.error,
    notice,
    act,
  };
}
