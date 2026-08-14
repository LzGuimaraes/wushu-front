import { useEffect, useState } from "react";
import { listClasses, listEnrollments, listStudents, listUsers } from "../api";
import type { ClassEntity, Enrollment, StudentProfile, User } from "../types";
import { getApiErrorMessage } from "../utils/apiError";

export interface Reference<T> {
  items: T[];
  error: string;
  loading: boolean;
  reload: () => void;
}

/** Carrega listas usadas para preencher selects (alunos, matrículas, turmas...). */
function useResource<T>(
  fetcher: () => Promise<{ data: T[] }>,
  fallbackError: string,
  enabled: boolean,
): Reference<T> {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(enabled);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    fetcher()
      .then((response) => {
        if (!active) return;
        setItems(response.data);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(getApiErrorMessage(requestError, fallbackError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetcher, fallbackError, enabled, reloadToken]);

  return {
    items,
    error,
    loading,
    reload: () => setReloadToken((token) => token + 1),
  };
}

export const useUsers = (enabled = true): Reference<User> =>
  useResource(
    listUsers,
    "Não foi possível carregar a lista de usuários",
    enabled,
  );

export const useStudents = (enabled = true): Reference<StudentProfile> =>
  useResource(
    listStudents,
    "Não foi possível carregar a lista de alunos",
    enabled,
  );

export const useEnrollments = (enabled = true): Reference<Enrollment> =>
  useResource(
    listEnrollments,
    "Não foi possível carregar a lista de matrículas",
    enabled,
  );

export const useClasses = (enabled = true): Reference<ClassEntity> =>
  useResource(
    listClasses,
    "Não foi possível carregar a lista de turmas",
    enabled,
  );
