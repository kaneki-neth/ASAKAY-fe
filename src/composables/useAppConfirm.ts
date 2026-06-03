import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

/**
 * Standard confirmation helper to ensure consistent UI across the app.
 * Uses the global ConfirmDialog component defined in AppLayout.vue.
 */
export function useAppConfirm() {
    const confirm = useConfirm();
    const toast = useToast();

    const confirmDelete = ({
        message = 'Are you sure you want to delete this item?',
        header = 'Confirm Deletion',
        icon = 'pi pi-exclamation-triangle',
        acceptLabel = 'Delete',
        rejectLabel = 'Cancel',
        onAccept = async () => {},
        onReject = () => {},
        successMessage = 'Item deleted successfully'
    }: {
        message?: string;
        header?: string;
        icon?: string;
        acceptLabel?: string;
        rejectLabel?: string;
        onAccept?: () => Promise<void> | void;
        onReject?: () => void;
        successMessage?: string | null;
    }) => {
        confirm.require({
            message,
            header,
            icon,
            rejectLabel,
            acceptLabel,
            rejectProps: {
                label: rejectLabel,
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: acceptLabel,
                severity: 'danger'
            },
            accept: async () => {
                try {
                    await onAccept();
                    if (successMessage) {
                        toast.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: successMessage,
                            life: 3000
                        });
                    }
                } catch (error) {
                    // Errors are generally handled by the API interceptor, 
                    // but we catch here to prevent promise unhandled rejections
                }
            },
            reject: onReject
        });
    };

    return {
        confirmDelete
    };
}
