// components/common/ConfirmDialog.tsx
import React from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <div className="confirm-dialog-content">
          <h3>Подтверждение действия</h3>
          <p>{message}</p>
          <div className="confirm-dialog-actions">
            <button onClick={onCancel} className="confirm-dialog-btn cancel">
              Отмена
            </button>
            <button onClick={onConfirm} className="confirm-dialog-btn confirm">
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
