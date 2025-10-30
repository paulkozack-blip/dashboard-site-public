// hooks/useConfirm.ts
import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const confirm = useCallback(
    (message: string, onConfirm: () => void, onCancel?: () => void) => {
      setConfig({ message, onConfirm, onCancel });
      setIsOpen(true);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    config?.onConfirm();
    setIsOpen(false);
    setConfig(null);
  }, [config]);

  const handleCancel = useCallback(() => {
    config?.onCancel?.();
    setIsOpen(false);
    setConfig(null);
  }, [config]);

  return {
    isOpen,
    message: config?.message || '',
    confirm,
    handleConfirm,
    handleCancel,
  };
};
