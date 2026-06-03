<script setup>
import { ref, onMounted } from 'vue';
import { listUsers } from '@/service/users';

// Dashboard Data
const totalUsers = ref(0);
const activeUsers = ref(0);
const systemHealth = ref('Operational');
const recentLogins = ref([]);

onMounted(async () => {
    try {
        const users = await listUsers({ include: 'roles' });
        
        // Total Users
        totalUsers.value = users.length;
        
        // Active Users (Assuming all users are active for now as we don't have a status field)
        activeUsers.value = users.length;
        
        // Recently Logged-in Users (Using created_at as proxy since last_login is not available)
        // Sort by created_at desc
        const sortedUsers = [...users].sort((a, b) => {
            return new Date(b.last_login_at || b.created_at) - new Date(a.last_login_at || a.created_at);
        });
        
        recentLogins.value = sortedUsers.slice(0, 5).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.roles && u.roles.length > 0 ? u.roles[0].name : 'User',
            lastLogin: formatDate(u.last_login_at || u.created_at) // Using last_login if available, else created_at
        }));
        
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
    }
});

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};

const getRoleSeverity = (role) => {
    if (!role) return 'secondary';
    const r = role.toLowerCase();
    if (r.includes('admin')) return 'danger';
    if (r.includes('editor') || r.includes('manager')) return 'info';
    if (r.includes('viewer') || r.includes('user')) return 'success';
    return 'secondary';
};
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Dashboard Overview Metrics -->
        <div class="col-span-12 lg:col-span-4 xl:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">Total Users</span>
                        <div class="text-900 font-medium text-xl">{{ totalUsers }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-blue-500 text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">24 new </span>
                <span class="text-500">since last visit</span>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-4 xl:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">Active Users</span>
                        <div class="text-900 font-medium text-xl">{{ activeUsers }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-100 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-user-check text-green-500 text-xl"></i>
                    </div>
                </div>
                <span class="text-500">Currently active sessions</span>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-4 xl:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">System Health</span>
                        <div class="text-900 font-medium text-xl">{{ systemHealth }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-heart text-purple-500 text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">Stable </span>
                <span class="text-500">last check 5m ago</span>
            </div>
        </div>

        <!-- Recently Logged-In Users Section -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Recently Logged-In Users</div>
                </div>
                <DataTable :value="recentLogins" :rows="5" :paginator="true" responsiveLayout="scroll" rowHover>
                    <template #empty>No recent logins found.</template>
                    <Column field="name" header="Name"></Column>
                    <Column field="email" header="Email"></Column>
                    <Column field="role" header="Role">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.role" :severity="getRoleSeverity(slotProps.data.role)" />
                        </template>
                    </Column>
                    <Column field="lastLogin" header="Last Login (Created At)"></Column>
                </DataTable>
            </div>
        </div>

        <!-- Audit Logs Placeholder -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Audit Logs</div>
                    <Tag value="Coming Soon" severity="warning" />
                </div>
                <p class="text-gray-500 mb-4">System audit logs will be displayed here in a future update.</p>
                <div class="h-32 flex items-center justify-center border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-900">
                    <span class="text-gray-400 font-medium">Placeholder for Audit Log Data</span>
                </div>
            </div>
        </div>
    </div>
</template>
