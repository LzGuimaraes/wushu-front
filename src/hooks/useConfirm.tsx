import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface PendingConfirm {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  resolve: (result: boolean) => void;
}

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
}

/**
 * Diálogo de confirmação estilizado (substitui o window.confirm nativo).
 *
 * Uso:
 *   const { askConfirm, confirmDialog } = useConfirm();
 *   const ok = await askConfirm("Excluir este item?");
 *   if (!ok) return;
 *   // ... executa a exclusão ...
 *   Renderize {confirmDialog} dentro do JSX retornado pela página.
 */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const askConfirm = useCallback(
    (message: ReactNode, options?: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({
          message,
          title: options?.title,
          confirmLabel: options?.confirmLabel,
          resolve,
        });
      }),
    [],
  );

  const close = useCallback((result: boolean) => {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const confirmDialog = pending ? (
    <ConfirmDialog
      title={pending.title}
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { askConfirm, confirmDialog };
}
