import { ref, computed } from 'vue';
import { getProfile } from '@/service/auth';

const userProfile = ref<any>(null);
const loading = ref(false);
let fetchPromise: Promise<any> | null = null;

export function usePermissions() {
    async function fetchProfile() {
        if (userProfile.value) return userProfile.value;
        if (fetchPromise) return fetchPromise;
        
        fetchPromise = (async () => {
            loading.value = true;
            try {
                const profile = await getProfile();
                userProfile.value = profile;
                return profile;
            } catch (error) {
                console.error('Failed to fetch profile for permissions', error);
                return null;
            } finally {
                loading.value = false;
                fetchPromise = null;
            }
        })();
        
        return fetchPromise;
    }

    function clearProfile() {
        userProfile.value = null;
    }

    const permissions = computed(() => {
        if (!userProfile.value) return [];
        // Extract permissions from roles
        const roles = userProfile.value.roles || [];
        const perms = new Set<string>();
        
        roles.forEach((role: any) => {
            const rolePerms = role.permissions || [];
            rolePerms.forEach((p: any) => perms.add(p.name));
        });

        // Also check if permissions are directly on the user object (depends on backend implementation)
        const directPerms = userProfile.value.permissions || [];
        directPerms.forEach((p: any) => perms.add(p.name));

        return Array.from(perms);
    });

    function hasPermission(permission: string) {
        if (!permission) return true;
        return permissions.value.includes(permission);
    }

    function hasAnyPermission(perms: string[]) {
        if (!perms || perms.length === 0) return true;
        return perms.some(p => permissions.value.includes(p));
    }

    function hasAllPermissions(perms: string[]) {
        if (!perms || perms.length === 0) return true;
        return perms.every(p => permissions.value.includes(p));
    }

    return {
        userProfile,
        loading,
        fetchProfile,
        clearProfile,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    };
}
