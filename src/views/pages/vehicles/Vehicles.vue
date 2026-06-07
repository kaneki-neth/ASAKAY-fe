<script setup>
import { onBeforeMount, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { listVehicles, deleteVehicle, getVehicleTypeOptions } from '@/service/vehicles/vehicles';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { usePermissions } from '@/composables/usePermissions';
import { useAppConfirm } from '@/composables/useAppConfirm';

const { hasPermission, fetchProfile } = usePermissions();
const { confirmDelete } = useAppConfirm();
const vehicles = ref([]);
const filters = ref(null);
const loading = ref(true);
const router = useRouter();
const toast = useToast();

const vehicleTypes = ref([]);

const statuses = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
];

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        code: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        vehicle_type_id: { value: null, matchMode: FilterMatchMode.EQUALS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}
initFilters();

onBeforeMount(async () => {
    loading.value = true;
    try {
        await fetchProfile();
        
        // Fetch vehicle types for the filter dropdown
        const typesData = await getVehicleTypeOptions();
        if (Array.isArray(typesData)) {
            vehicleTypes.value = typesData;
        }
        
        await fetchVehicleList();
    } catch (e) {
        console.error('Initialization error', e);
    } finally {
        loading.value = false;
    }
});

async function fetchVehicleList() {
    loading.value = true;
    try {
        vehicles.value = await listVehicles();
    } catch (e) {
        vehicles.value = [];
    } finally {
        loading.value = false;
    }
}

function clearFilter() {
    initFilters();
}

function formatDate(value) {
    const d = value ? new Date(value) : null;
    return d ? d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
}

function getStatusSeverity(status) {
    if (!status) return null;
    const s = status.toLowerCase();
    switch (s) {
        case 'active':
            return 'success';
        case 'inactive':
            return 'danger';
        default:
            return null;
    }
}

function getTypeName(id) {
    const type = vehicleTypes.value.find(t => t.id === id);
    return type ? type.name : 'Unknown';
}

function goCreate() {
    router.push('/transport/vehicles/new');
}
function goView(row) {
    router.push(`/transport/vehicles/${row.id}`);
}
function goEdit(row) {
    router.push(`/transport/vehicles/${row.id}/edit`);
}

function confirmDeleteRow(row) {
    confirmDelete({
        message: `Are you sure you want to delete vehicle "${row.name}"?`,
        onAccept: async () => {
            loading.value = true;
            try {
                await deleteVehicle(row.id);
                await fetchVehicleList();
            } finally {
                loading.value = false;
            }
        },
        successMessage: 'Vehicle deleted successfully'
    });
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-xl">Vehicles</div>
            <Button v-if="hasPermission('can_create_vehicles')" label="New Vehicle" icon="pi pi-plus" @click="goCreate" />
        </div>

        <AppDataTable
            :value="vehicles"
            :loading="loading"
            v-model:filters="filters"
            :globalFilterFields="['name', 'code']"
            @clear="clearFilter"
            @refresh="fetchVehicleList"
        >
            <template #empty> No vehicles found. </template>
            
            <Column field="name" header="Name" sortable>
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>{{ data.name || '-' }}</template>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                </template>
            </Column>

            <Column field="code" header="Code" sortable>
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>{{ data.code || '-' }}</template>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by code" />
                </template>
            </Column>

            <Column field="vehicle_type_id" header="Type" sortable>
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>
                        {{ data.vehicle_type ? data.vehicle_type.name : (getTypeName(data.vehicle_type_id) || '-') }}
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <Select v-model="filterModel.value" :options="vehicleTypes" optionLabel="name" optionValue="id" placeholder="Select a Type" showClear />
                </template>
            </Column>

            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <Tag v-else :value="data.status || '-'" :severity="getStatusSeverity(data.status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Select v-model="filterModel.value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Select a Status" showClear />
                </template>
            </Column>

            <Column field="created_at" header="Created" sortable dataType="date">
                <template #body="{ data }">
                    <Skeleton v-if="loading" class="block" height="1.5rem" />
                    <template v-else>{{ formatDate(data.created_at) }}</template>
                </template>
            </Column>

            <Column header="Actions" class="w-32">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-eye" outlined rounded @click="goView(data)" />
                        <Button v-if="hasPermission('can_edit_vehicles')" icon="pi pi-pencil" outlined rounded severity="success" @click="goEdit(data)" />
                        <Button v-if="hasPermission('can_delete_vehicles')" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRow(data)" />
                    </div>
                </template>
            </Column>
        </AppDataTable>
    </div>
</template>
