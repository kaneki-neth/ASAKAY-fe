<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, ref, onBeforeMount, watch } from 'vue';
import { useRoute } from 'vue-router';

const { layoutState, isDesktop } = useLayout();
const route = useRoute();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },
    parentItemKey: {
        type: String,
        default: null
    }
});

const itemKey = computed(() => {
    return props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);
});

const isActiveMenu = computed(() => {
    return layoutState.activeMenuItem === itemKey.value || (layoutState.activeMenuItem ? layoutState.activeMenuItem.startsWith(itemKey.value + '-') : false);
});

const checkActiveRoute = (item) => {
    return route.path === item.to;
};

watch(
    () => route.path,
    () => {
        if (props.item.to && checkActiveRoute(props.item)) {
            layoutState.activeMenuItem = itemKey.value;
        }
    }
);

onBeforeMount(() => {
    if (props.item.to && checkActiveRoute(props.item)) {
        layoutState.activeMenuItem = itemKey.value;
    }
});

const itemClick = (event, item) => {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    if (item.items) {
        layoutState.activeMenuItem = isActiveMenu.value ? props.parentItemKey : itemKey.value;
    } else {
        layoutState.overlayMenuActive = false;
        layoutState.mobileMenuActive = false;
    }
};
</script>

<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>
        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon" />
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items" />
        </a>
        <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item)" activeClass="active-route" :class="[item.class]" tabindex="0" :to="item.to">
            <i :class="item.icon" class="layout-menuitem-icon" />
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items" />
        </router-link>
        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <app-menu-item v-for="(child, i) in item.items" :key="child.label" :item="child" :index="i" :root="false" :parentItemKey="itemKey" />
            </ul>
        </Transition>
    </li>
</template>
