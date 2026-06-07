export default [
        {
                path: '/transport/vehicles',
                name: 'vehicles',
                component: () => import('@/views/pages/vehicles/Vehicles.vue'),
                meta: { requiresAuth: true, permission: 'can_view_vehicles' },
        },
        {
                path: '/transport/vehicles/new',
                name: 'vehicle-new',
                component: () => import('@/views/pages/vehicles/VehicleForm.vue'),
                meta: { requiresAuth: true, permission: 'can_create_vehicles' },
        },
        {
                path: '/transport/vehicles/:id',
                name: 'vehicle-detail',
                component: () => import('@/views/pages/vehicles/VehicleDetail.vue'),
                meta: { requiresAuth: true, permission: 'can_view_vehicles' },
        },
        {
                path: '/transport/vehicles/:id/edit',
                name: 'vehicle-edit',
                component: () => import('@/views/pages/vehicles/VehicleForm.vue'),
                meta: { requiresAuth: true, permission: 'can_edit_vehicles' },
        },
        {
                path: '/transport/vehicle-types',
                name: 'vehicle-types',
                component: () => import('@/views/pages/vehicles/VehicleTypes.vue'),
                meta: { requiresAuth: true, permission: 'vehicle-type.view' },
        },
]
