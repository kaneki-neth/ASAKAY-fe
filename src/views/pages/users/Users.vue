<script setup>
import api from '@/service/api'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePermissions } from '@/composables/usePermissions';
import { useAppConfirm } from '@/composables/useAppConfirm';

const { hasPermission, fetchProfile } = usePermissions();
const { confirmDelete } = useAppConfirm();
const users = ref([]);
const filters = ref(null);
const loading = ref(true);
const router = useRouter();

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
}
initFilters();

onBeforeMount(async () => {
    loading.value = true;
    try {
        await fetchProfile();
        await fetchUsers();
    } catch (e) {
        console.error('Initialization error', e);
    } finally {
        loading.value = false;
    }
});

async function fetchUsers() {
    loading.value = true;
    try {
        const res = await api.get('/users');
        const list = res.data?.data ?? res.data ?? [];
        users.value = Array.isArray(list) ? list : [];
    } catch (e) {
        users.value = [];
    } finally {
        loading.value = false;
    }
}

function clearFilter() {
    initFilters();
}

function formatDate(value) {
    const d = value ? new Date(value) : null
    return d
        ? d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
}

function goCreate() {
    router.push('/accounts/users/new');
}

function goView(row) {
    router.push(`/accounts/users/${row.id}`);
}

function goEdit(row) {
    router.push(`/accounts/users/${row.id}/edit`);
}

function confirmDeleteRow(row) {
    confirmDelete({
        message: `Are you sure you want to delete user "${row.name}"?`,
        onAccept: async () => {
            loading.value = true;
            try {
                await api.delete(`/users/${row.id}`);
                await fetchUsers();
            } finally {
                loading.value = false;
            }
        },
        successMessage: 'User deleted successfully'
    });
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-xl">Users</div>
            <Button v-if="hasPermission('can_create_users')" label="New User" icon="pi pi-plus" @click="goCreate" />
        </div>
        <AppDataTable
            :value="users"
            :loading="loading"
            v-model:filters="filters"
            :globalFilterFields="['name', 'email']"
            @clear="clearFilter"
            @refresh="fetchUsers"
        >
            <template #empty> No users found. </template>
            
            <Column field="name" header="Name" sortable>
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>{{ data.name }}</template>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                </template>
            </Column>

            <Column field="email" header="Email" sortable>
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>{{ data.email }}</template>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by email" />
                </template>
            </Column>

            <Column header="Roles">
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <div v-else class="flex flex-wrap gap-1">
                        <Tag v-for="role in data.roles" :key="role.id" :value="role.name" severity="info" />
                        <span v-if="!data.roles?.length" class="text-gray-400">-</span>
                    </div>
                </template>
            </Column>

            <Column field="created_at" header="Created" sortable dataType="date">
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>{{ formatDate(data.created_at) }}</template>
                </template>
            </Column>

            <Column header="Actions">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-eye" outlined @click="goView(data)" />
                        <Button v-if="hasPermission('can_edit_users')" icon="pi pi-pencil" outlined severity="success" @click="goEdit(data)" />
                        <Button v-if="hasPermission('can_delete_users')" icon="pi pi-trash" outlined severity="danger" @click="confirmDeleteRow(data)" />
                    </div>
                </template>
            </Column>
        </AppDataTable>
    </div>
</template>
