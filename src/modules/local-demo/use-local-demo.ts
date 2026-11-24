"use client";
import { useEffect, useRef, useState } from "react";
async function transform(value: unknown, writing: boolean): Promise<unknown> {
  if (!writing && value instanceof Blob) return URL.createObjectURL(value);
  if (writing && typeof value === "string" && value.startsWith("blob:"))
    return (await fetch(value)).blob();
  if (Array.isArray(value))
    return Promise.all(value.map((v) => transform(v, writing)));
  if (value && typeof value === "object")
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value).map(async ([k, v]) => [
          k,
          await transform(v, writing),
        ]),
      ),
    );
  return value;
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("youcon-demo-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("demos");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
async function read(key: string) {
  const db = await database();
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const r = db.transaction("demos").objectStore("demos").get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
async function write(key: string, value: unknown) {
  const encoded = await transform(value, true);
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("demos", "readwrite");
      tx.objectStore("demos").put(encoded, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export function useLocalDemo<T>(
  key: string,
  initial: T,
  project: (value: T) => T = (v) => v,
) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const projection = useRef(project);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let alive = true;
    read(key)
      .then(async (saved) => (saved ? transform(saved, false) : undefined))
      .then((saved) => {
        if (alive) {
          if (saved) setValue(projection.current(saved as T));
          setReady(true);
        }
      })
      .catch(() => {
        if (alive) {
          setError(
            "Armazenamento local indisponível. Esta sessão ficará somente em memória.",
          );
          setReady(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current
      .then(() => write(key, value))
      .catch(() => {
        setError(
          "Não foi possível salvar no navegador. Evite recarregar até liberar espaço; nenhum dado foi enviado ao servidor.",
        );
      });
  }, [key, value, ready]);
  return { value, setValue, ready, error };
}
