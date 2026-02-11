export default [
	{
		path: '/accounts/roles',
		name: 'roles',
		component: () => import('@/views/pages/roles/Roles.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/accounts/roles/new',
		name: 'role-new',
		component: () => import('@/views/pages/roles/RoleForm.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/accounts/roles/:id',
		name: 'role-detail',
		component: () => import('@/views/pages/roles/RoleDetail.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/accounts/roles/:id/edit',
		name: 'role-edit',
		component: () => import('@/views/pages/roles/RoleForm.vue'),
		meta: { requiresAuth: true },
	},
]
