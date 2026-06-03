export interface ToastOptions {
  severity?: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
  summary?: string;
  detail?: string;
  life?: number;
}

export function showToast(options: ToastOptions) {
  const event = new CustomEvent('app:toast', { detail: options });
  window.dispatchEvent(event);
}

export function emitError(message: string) {
  showToast({ severity: 'error', summary: 'Error', detail: message });
}

export function emitUnauth() {
  const event = new CustomEvent('app:unauth');
  window.dispatchEvent(event);
  showToast({ severity: 'error', summary: 'Unauthorized', detail: 'You do not have permission to perform this action.' });
}
