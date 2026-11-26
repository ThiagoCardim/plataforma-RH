"use client";
import { useState } from "react";
import { type Scope } from "../career/model";
import { useLocalDemo } from "../local-demo/use-local-demo";
import { type State } from "./model";
import {
  projectResumeDatabase,
  recordResumeChanges,
  runArchiveRules,
} from "./resume-model";
export function useRecruitment(initial: State, scope: Scope) {
  const [seed] = useState(() => projectResumeDatabase(initial, scope));
  const local = useLocalDemo(`recruitment-v1:${scope.key}`, seed, (s) =>
      scope.rh
        ? runArchiveRules(projectResumeDatabase(s, scope), scope)
        : projectResumeDatabase(s, scope),
    ),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  function act(
    fn: (s: State) => State,
    text = "Simulação salva somente neste navegador.",
  ) {
    try {
      const result = recordResumeChanges(local.value, fn(local.value), scope);
      const next = scope.rh ? runArchiveRules(result, scope) : result;
      local.setValue(next);
      setError("");
      setNotice(
        (next.duplicateReviews?.length ?? 0) >
          (local.value.duplicateReviews?.length ?? 0)
          ? "Possível duplicidade recebida. Revise no Banco de Currículos; nenhum cadastro foi unificado automaticamente."
          : text,
      );
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
