<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { listVehicles, deleteVehicle, getVehicleTypeOptions, createVehicle, updateVehicle } from '@/service/vehicles/vehicles';
import { FilterMatchMode } from '@primevue/core/api';
import { usePermissions } from '@/composables/usePermissions';
import { useAppConfirm } from '@/composables/useAppConfirm';

const { hasPermission, fetchProfile } = usePermissions();
const { confirmDelete } = useAppConfirm();
const vehicles = ref<any[]>([]);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const loading = ref(true);
const saving = ref(false);
const toast = useToast();

const vehicleTypes = ref<any[]>([]);
const showDrawer = ref(false);
const isEditing = ref(false);

const statuses = [
    { label: 'Online', value: 'active', color: '#137333', bg: '#E6F4EA' },
    { label: 'Maintenance', value: 'maintenance', color: '#B06000', bg: '#FEF7E0' },
    { label: 'Offline', value: 'inactive', color: '#C5221F', bg: '#FCE8E6' }
];

const form = ref({
    id: null as number | null,
    name: '',
    code: '',
    vehicle_type_id: null as number | null,
    status: 'active',
    description: ''
});

const errors = ref<Record<string, string>>({});

onBeforeMount(async () => {
    loading.value = true;
    try {
        await fetchProfile();
        const typesData = await getVehicleTypeOptions();
        vehicleTypes.value = typesData;
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
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

function getStatusDetails(status: string) {
    const s = status?.toLowerCase() || 'inactive';
    return statuses.find(item => item.value === s) || statuses[2];
}

function openNew() {
    isEditing.value = false;
    form.value = {
        id: null,
        name: '',
        code: '',
        vehicle_type_id: null,
        status: 'active',
        description: ''
    };
    errors.value = {};
    showDrawer.value = true;
}

function openEdit(row: any) {
    isEditing.value = true;
    form.value = {
        id: row.id,
        name: row.name || '',
        code: row.code || '',
        vehicle_type_id: row.vehicle_type_id || null,
        status: row.status || 'active',
        description: row.description || ''
    };
    errors.value = {};
    showDrawer.value = true;
}

function validate() {
    errors.value = {};
    if (!form.value.name?.trim()) errors.value.name = 'Name is required';
    if (!form.value.vehicle_type_id) errors.value.vehicle_type_id = 'Type is required';
    return Object.keys(errors.value).length === 0;
}

async function handleSave() {
    if (!validate()) return;
    
    saving.value = true;
    try {
        if (isEditing.value && form.value.id) {
            await updateVehicle(form.value.id, form.value);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Transport updated', life: 3000 });
        } else {
            await createVehicle(form.value);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Transport created', life: 3000 });
        }
        showDrawer.value = false;
        await fetchVehicleList();
    } catch (e) {
        // Errors handled by interceptor
    } finally {
        saving.value = false;
    }
}

function confirmDeleteRow(row: any) {
    confirmDelete({
        message: `Are you sure you want to delete transport "${row.name}"?`,
        onAccept: async () => {
            loading.value = true;
            try {
                await deleteVehicle(row.id);
                await fetchVehicleList();
            } finally {
                loading.value = false;
            }
        },
        successMessage: 'Transport deleted successfully'
    });
}
</script>

<template>
    <div class="space-y-6 font-geist">
        <!-- Page Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-3xl font-bold text-on-surface">Transports</h2>
                <p class="text-on-surface-variant mt-1">Manage all active vehicles in the ASAKAY network.</p>
            </div>
            <button v-if="hasPermission('can_create_vehicles')" @click="openNew" class="bg-primary hover:bg-primary-container text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                <span class="material-symbols-outlined text-sm">add</span>
                Add New Transport
            </button>
        </div>

        <!-- Content Container -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
            <AppDataTable
                :value="vehicles"
                :loading="loading"
                v-model:filters="filters"
                :globalFilterFields="['name', 'code']"
                @clear="clearFilter"
                @refresh="fetchVehicleList"
            >
                <template #empty> No transports found. </template>
                
                <Column field="name" header="Name" sortable>
                    <template #body="{ data }">
                        <div>
                            <div class="font-medium text-on-surface">{{ data.name || '-' }}</div>
                            <div class="text-on-surface-variant text-xs mt-0.5">ID: {{ data.code || '-' }}</div>
                        </div>
                    </template>
                </Column>

                <Column field="vehicle_type_id" header="Type" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-outline text-[18px]">
                                {{ data.vehicle_type?.name?.toLowerCase().includes('bus') ? 'directions_bus' : 
                                   data.vehicle_type?.name?.toLowerCase().includes('ferry') ? 'directions_boat' : 
                                   data.vehicle_type?.name?.toLowerCase().includes('tram') ? 'tram' : 'commute' }}
                            </span>
                            {{ data.vehicle_type?.name || '-' }}
                        </div>
                    </template>
                </Column>

                <Column field="status" header="Status" sortable>
                    <template #body="{ data }">
                        <span 
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs"
                            :style="{ backgroundColor: getStatusDetails(data.status).bg, color: getStatusDetails(data.status).color }"
                        >
                            <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: getStatusDetails(data.status).color }"></span>
                            {{ getStatusDetails(data.status).label }}
                        </span>
                    </template>
                </Column>

                <Column header="Actions" class="w-32 text-right">
                    <template #body="{ data }">
                        <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button @click="openEdit(data)" class="text-on-surface-variant hover:text-primary p-1.5 transition-colors">
                                <span class="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button v-if="hasPermission('can_delete_vehicles')" @click="confirmDeleteRow(data)" class="text-on-surface-variant hover:text-error p-1.5 transition-colors">
                                <span class="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </template>
                </Column>
            </AppDataTable>
        </div>

        <!-- Create/Edit Drawer -->
        <Drawer v-model:visible="showDrawer" position="right" :header="isEditing ? 'Edit Transport' : 'Create Transport'" class="!w-full !max-w-md">
            <div class="flex flex-col h-full">
                <div class="flex-1 overflow-y-auto space-y-6 pt-2">
                    <!-- Name -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-on-surface">Transport Name</label>
                        <InputText v-model="form.name" class="w-full" :class="{'p-invalid': errors.name}" placeholder="e.g. Bus 102" />
                        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                    </div>

                    <!-- Code -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-on-surface">Transport Code (ID)</label>
                        <InputText v-model="form.code" class="w-full" placeholder="e.g. TRN-102" />
                    </div>

                    <!-- Type -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-on-surface">Transport Type</label>
                        <Select v-model="form.vehicle_type_id" :options="vehicleTypes" optionLabel="name" optionValue="id" placeholder="Select a type..." class="w-full" :class="{'p-invalid': errors.vehicle_type_id}" />
                        <small v-if="errors.vehicle_type_id" class="p-error">{{ errors.vehicle_type_id }}</small>
                    </div>

                    <!-- Status -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-on-surface">Status</label>
                        <div class="grid grid-cols-3 gap-3">
                            <div 
                                v-for="status in statuses" 
                                :key="status.value"
                                @click="form.status = status.value"
                                class="border rounded-md p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors relative"
                                :class="form.status === status.value ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container-low'"
                            >
                                <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: status.color }"></span>
                                <span class="text-xs">{{ status.label }}</span>
                                <div v-if="form.status === status.value" class="absolute top-1 right-1">
                                    <i class="pi pi-check-circle text-primary text-xs"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-on-surface">Description</label>
                        <Textarea v-model="form.description" rows="4" class="w-full" placeholder="Enter optional details..." />
                    </div>
                </div>

                <div class="pt-6 border-t border-outline-variant flex justify-end gap-3 bg-surface sticky bottom-0">
                    <button @click="showDrawer = false" class="px-4 py-2 border border-outline-variant rounded-full text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">Cancel</button>
                    <button @click="handleSave" :disabled="saving" class="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <i v-if="saving" class="pi pi-spin pi-spinner text-xs"></i>
                        {{ isEditing ? 'Update Transport' : 'Save Transport' }}
                    </button>
                </div>
            </div>
        </Drawer>
    </div>
</template>

<style scoped>
.font-geist {
    font-family: 'Geist', sans-serif;
}
:deep(.p-datatable-tbody > tr) {
    cursor: pointer;
}
:deep(.p-drawer-header) {
    padding: 1.5rem;
    border-bottom: 1px solid var(--p-outline-variant);
}
:deep(.p-drawer-content) {
    padding: 1.5rem;
}
</style>
