<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { isAuthenticated } from '@/service/auth';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const { layoutConfig, layoutState, hideMobileMenu } = useLayout();
const toast = useToast();
const router = useRouter();

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': (layoutState as any).mobileMenuActive,
        'layout-static-inactive': layoutState.staticMenuInactive
    };
});

function onError(e: CustomEvent<any>) {
    const path = router.currentRoute.value.path;
    if (path === '/login') return;
    const msg = e?.detail?.message || 'Unexpected error';
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
}

function onToast(e: CustomEvent<any>) {
    toast.add(e.detail);
}

onMounted(() => {
    window.addEventListener('app:error', onError as EventListener);
    window.addEventListener('app:toast', onToast as EventListener);
    window.addEventListener('app:unauth', () => {
        const route = router.currentRoute.value;
        const requiresAuth = !!route.meta?.requiresAuth;
        const authed = isAuthenticated();
        if (requiresAuth && !authed && route.path !== '/login') {
            router.replace('/login');
        }
    });
});

onBeforeUnmount(() => {
    window.removeEventListener('app:error', onError as EventListener);
    window.removeEventListener('app:unauth', () => {});
});
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <AppTopbar />
        <AppSidebar />
        <div class="layout-main-container">
            <div class="layout-main">
                <router-view />
            </div>
            <AppFooter />
        </div>
        <div class="layout-mask animate-fadein" @click="hideMobileMenu" />
    </div>
    <Toast />
    <ConfirmDialog :style="{ width: '450px' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" :dismissableMask="true" />
</template>
