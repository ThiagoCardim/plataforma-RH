"use client";
import { useState } from "react";
import { type Scope } from "../career/model";
import { useLocalDemo } from "../local-demo/use-local-demo";
import { type AcademyState, projection } from "./model";
export function useAcademy(initial: AcademyState, scope: Scope) {
  const local = useLocalDemo(`academy-v1:${scope.key}`, initial, (v) =>
    projection(v, scope),
  );
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  function act(
    fn: (s: AcademyState) => AcademyState,
    text = "Alteração demonstrativa salva neste navegador.",
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
    clear: () => {
      setError("");
      setNotice("");
    },
  };
}
