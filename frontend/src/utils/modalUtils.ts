import { ModalMode } from '../components/SuccessActionModal';

/**
 * Modern popup utility to replace Swal.fire
 */
export const showModal = (
  title: string, 
  description: string, 
  mode: ModalMode = 'success', 
  onClose?: () => void
) => {
  const event = new CustomEvent('app:show-modal', {
    detail: { title, description, mode, onClose }
  });
  window.dispatchEvent(event);
};

export const showSuccess = (title: string, description: string, onClose?: () => void) => 
  showModal(title, description, 'success', onClose);

export const showDenied = (title: string, description: string, onClose?: () => void) => 
  showModal(title, description, 'denied', onClose);

export const showError = (title: string, description: string, onClose?: () => void) => 
  showModal(title, description, 'error', onClose);
