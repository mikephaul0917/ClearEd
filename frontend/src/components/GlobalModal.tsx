import React, { useState, useEffect } from 'react';
import SuccessActionModal, { ModalMode } from './SuccessActionModal';

interface GlobalModalEvent extends CustomEvent {
  detail: {
    title: string;
    description: string;
    mode?: ModalMode;
    onClose?: () => void;
  };
}

const GlobalModal: React.FC = () => {
  const [modalState, setModalState] = useState<{
    open: boolean;
    title: string;
    description: string;
    mode: ModalMode;
    onClose?: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    mode: 'success'
  });

  useEffect(() => {
    const handleShowModal = (event: Event) => {
      const e = event as GlobalModalEvent;
      setModalState({
        open: true,
        title: e.detail.title,
        description: e.detail.description,
        mode: e.detail.mode || 'success',
        onClose: e.detail.onClose
      });
    };

    window.addEventListener('app:show-modal', handleShowModal);
    return () => window.removeEventListener('app:show-modal', handleShowModal);
  }, []);

  const handleClose = () => {
    if (modalState.onClose) {
      modalState.onClose();
    }
    setModalState(prev => ({ ...prev, open: false }));
  };

  return (
    <SuccessActionModal
      open={modalState.open}
      onClose={handleClose}
      title={modalState.title}
      description={modalState.description}
      mode={modalState.mode}
    />
  );
};

export default GlobalModal;

/**
 * Utility function to trigger the global modal from anywhere
 */
export const showGlobalModal = (title: string, description: string, mode: ModalMode = 'success', onClose?: () => void) => {
  const event = new CustomEvent('app:show-modal', {
    detail: { title, description, mode, onClose }
  });
  window.dispatchEvent(event);
};
