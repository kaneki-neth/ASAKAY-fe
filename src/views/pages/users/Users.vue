<script setup>
import api from '@/service/api'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { deleteUser } from '@/service/users';

const users = ref([]);
const filters = ref(null);
const loading = ref(true);
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();

initFilters();

onBeforeMount(async () => {
    await fetchUsers();
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

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
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

function confirmDelete(row) {
    confirm.require({
        message: 'Delete this user?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
        accept: async () => {
            loading.value = true;
            try {
                await deleteUser(row.id);
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'User deleted', life: 2500 });
                await fetchUsers();
            } catch (e) {
                
            } finally {
                loading.value = false;
            }
        }
    });
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-xl">Users</div>
            <Button label="New User" icon="pi pi-plus" @click="goCreate" />
        </div>
        <AppDataTable
            :value="users"
            :loading="loading"
            v-model:filters="filters"
            :globalFilterFields="['name', 'email']"
            @clear="clearFilter"
        >
            <template #empty> No users found. </template>
            <Column field="name" header="Name">
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>{{ data.name }}</template>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                </template>
            </Column>
            <Column field="email" header="Email">
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
            <Column field="created_at" header="Created" dataType="date">
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>{{ formatDate(data.created_at) }}</template>
                </template>
            </Column>
            <Column header="Actions">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-eye" outlined @click="goView(data)" />
                        <Button icon="pi pi-pencil" outlined @click="goEdit(data)" />
                        <Button icon="pi pi-trash" severity="danger" outlined @click="confirmDelete(data)" />
                    </div>
                </template>
            </Column>
        </AppDataTable>
    </div>
</template>
