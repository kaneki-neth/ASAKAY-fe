<script setup>
import { ref, onMounted, computed } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
import { usePermissions } from '@/composables/usePermissions';

const { hasPermission, fetchProfile } = usePermissions();

onMounted(async () => {
    await fetchProfile();
});

const model = computed(() => [
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' },
            {
                label: 'Accounts',
                icon: 'pi pi-fw pi-user',
                visible: hasPermission('can_view_users') || hasPermission('can_view_roles'),
                items: [
                    {
                        label: 'Users',
                        icon: 'pi pi-fw pi-sign-in',
                        to: '/accounts/users',
                        visible: hasPermission('can_view_users')
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-fw pi-times-circle',
                        to: '/accounts/roles',
                        visible: hasPermission('can_view_roles')
                    },

                ]
            },
        ]
    },
    {
        label: 'Transport',
        visible: hasPermission('can_view_vehicles') || hasPermission('vehicle-type.view') || hasPermission('stop.view') || hasPermission('route.view'),
        items: [
            {
                label: 'Vehicles',
                icon: 'pi pi-fw pi-car',
                to: '/transport/vehicles',
                visible: hasPermission('can_view_vehicles')
            },
            {
                label: 'Vehicle Types',
                icon: 'pi pi-fw pi-tags',
                to: '/transport/vehicle-types',
                visible: hasPermission('vehicle-type.view')
            },
            {
                label: 'Stops',
                icon: 'pi pi-fw pi-map-marker',
                to: '/transport/stops',
                visible: hasPermission('stop.view')
            },
            {
                label: 'Routes',
                icon: 'pi pi-fw pi-map',
                to: '/transport/routes',
                visible: hasPermission('route.view')
            },
            {
                label: 'Navigator',
                icon: 'pi pi-fw pi-compass',
                to: '/transport/navigator'
            }
        ]
    },


    {
        label: 'Accounts',
        visible: false, // Hidden for now as requested to focus on core RBAC
        items: [
            {
                label: 'Table',
                icon: 'pi pi-fw pi-table',
                to: '/accounts/table'
            },
            {
                label: 'List',
                icon: 'pi pi-fw pi-list',
                to: '/accounts/list'
            },
            {
                label: 'Tree',
                icon: 'pi pi-fw pi-share-alt',
                to: '/uikit/tree'
            },
            {
                label: 'Panel',
                icon: 'pi pi-fw pi-tablet',
                to: '/uikit/panel'
            },
            {
                label: 'Overlay',
                icon: 'pi pi-fw pi-clone',
                to: '/uikit/overlay'
            },
            {
                label: 'Media',
                icon: 'pi pi-fw pi-image',
                to: '/uikit/media'
            },
            {
                label: 'Menu',
                icon: 'pi pi-fw pi-bars',
                to: '/uikit/menu'
            },
            {
                label: 'Message',
                icon: 'pi pi-fw pi-comment',
                to: '/uikit/message'
            },
            {
                label: 'File',
                icon: 'pi pi-fw pi-file',
                to: '/uikit/file'
            },
            {
                label: 'Chart',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/uikit/charts'
            },
            {
                label: 'Timeline',
                icon: 'pi pi-fw pi-calendar',
                to: '/uikit/timeline'
            },
            {
                label: 'Misc',
                icon: 'pi pi-fw pi-circle',
                to: '/uikit/misc'
            }
        ]
    },
    {
        label: 'Prime Blocks',
        icon: 'pi pi-fw pi-prime',
        visible: false,
        items: [
            {
                label: 'Free Blocks',
                icon: 'pi pi-fw pi-eye',
                to: '/blocks/free'
            },
            {
                label: 'All Blocks',
                icon: 'pi pi-fw pi-globe',
                url: 'https://blocks.primevue.org/',
                target: '_blank'
            }
        ]
    },
    {
        label: 'Pages',
        icon: 'pi pi-fw pi-briefcase',
        visible: false,
        items: [
            {
                label: 'Landing',
                icon: 'pi pi-fw pi-globe',
                to: '/landing'
            },
            {
                label: 'Auth',
                icon: 'pi pi-fw pi-user',
                items: [
                    {
                        label: 'Login',
                        icon: 'pi pi-fw pi-sign-in',
                        to: '/auth/login'
                    },
                    {
                        label: 'Error',
                        icon: 'pi pi-fw pi-times-circle',
                        to: '/auth/error'
                    },
                    {
                        label: 'Access Denied',
                        icon: 'pi pi-fw pi-lock',
                        to: '/auth/access'
                    }
                ]
            },
            {
                label: 'Crud',
                icon: 'pi pi-fw pi-pencil',
                to: '/pages/crud'
            },
            {
                label: 'Not Found',
                icon: 'pi pi-fw pi-exclamation-circle',
                to: '/pages/notfound'
            },
            {
                label: 'Empty',
                icon: 'pi pi-fw pi-circle-off',
                to: '/pages/empty'
            }
        ]
    },
    {
        label: 'Hierarchy',
        icon: 'pi pi-fw pi-align-left',
        visible: false,
        items: [
            {
                label: 'Submenu 1',
                icon: 'pi pi-fw pi-align-left',
                items: [
                    {
                        label: 'Submenu 1.1',
                        icon: 'pi pi-fw pi-align-left',
                        items: [
                            {
                                label: 'Submenu 1.1.1',
                                icon: 'pi pi-fw pi-align-left'
                            },
                            {
                                label: 'Submenu 1.1.2',
                                icon: 'pi pi-fw pi-align-left'
                            },
                            {
                                label: 'Submenu 1.1.3',
                                icon: 'pi pi-fw pi-align-left'
                            }
                        ]
                    },
                    {
                        label: 'Submenu 1.2',
                        icon: 'pi pi-fw pi-align-left',
                        items: [
                            {
                                label: 'Submenu 1.2.1',
                                icon: 'pi pi-fw pi-align-left'
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Submenu 2',
                icon: 'pi pi-fw pi-align-left',
                items: [
                    {
                        label: 'Submenu 2.1',
                        icon: 'pi pi-fw pi-align-left',
                        items: [
                            {
                                label: 'Submenu 2.1.1',
                                icon: 'pi pi-fw pi-align-left'
                            },
                            {
                                label: 'Submenu 2.1.2',
                                icon: 'pi pi-fw pi-align-left'
                            }
                        ]
                    },
                    {
                        label: 'Submenu 2.2',
                        icon: 'pi pi-fw pi-align-left',
                        items: [
                            {
                                label: 'Submenu 2.2.1',
                                icon: 'pi pi-fw pi-align-left'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        label: 'Get Started',
        visible: false,
        items: [
            {
                label: 'Documentation',
                icon: 'pi pi-fw pi-book',
                to: '/start/documentation'
            },
            {
                label: 'View Source',
                icon: 'pi pi-fw pi-github',
                url: 'https://github.com/primefaces/sakai-vue',
                target: '_blank'
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>

