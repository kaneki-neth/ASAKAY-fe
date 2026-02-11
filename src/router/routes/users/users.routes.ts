export default [
	{
		path: '/accounts/users',
		name: 'users',
		component: () => import('@/views/pages/users/Users.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/accounts/users/new',
		name: 'user-new',
		component: () => import('@/views/pages/users/UserForm.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/accounts/users/:id',
		name: 'user-detail',
		component: () => import('@/views/pages/users/UserDetail.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/accounts/users/:id/edit',
		name: 'user-edit',
		component: () => import('@/views/pages/users/UserForm.vue'),
		meta: { requiresAuth: true },
	},
]
