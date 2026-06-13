<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { listVehicleTypes, createVehicleType, updateVehicleType, deleteVehicleType } from '@/service/vehicles/vehicles'
import { usePermissions } from '@/composables/usePermissions'
import { useAppConfirm } from '@/composables/useAppConfirm'

const toast = useToast()
const { hasPermission, fetchProfile } = usePermissions()
const { confirmDelete } = useAppConfirm()

const vehicleTypes = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const dialogLoading = ref(false)

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const initialForm = {
    id: null,
    name: '',
    description: '',
    status: 'active'
}

const form = ref({ ...initialForm })
const errors = ref<Record<string, string>>({})
const isCreate = ref(true)

const statuses = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
]

async function loadData() {
    loading.value = true
    try {
        vehicleTypes.value = await listVehicleTypes()
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load vehicle types', life: 3000 })
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await fetchProfile()
    loadData()
})

function openNew() {
    isCreate.value = true
    form.value = { ...initialForm }
    errors.value = {}
    dialog.value = true
}

function editRecord(data: any) {
    isCreate.value = false
    form.value = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        status: data.status
    }
    errors.value = {}
    dialog.value = true
}

function validate() {
    errors.value = {}
    if (!form.value.name?.trim()) errors.value.name = 'Name is required'
    return Object.keys(errors.value).length === 0
}

async function saveRecord() {
    if (!validate()) return

    dialogLoading.value = true
    try {
        if (isCreate.value) {
            await createVehicleType(form.value)
            toast.add({ severity: 'success', summary: 'Created', detail: 'Transport type created' })
        } else {
            await updateVehicleType(form.value.id!, form.value)
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Transport type updated' })
        }
        dialog.value = false
        loadData()
    } catch (e) {
        // Errors handled by interceptor
    } finally {
        dialogLoading.value = false
    }
}

function confirmDeleteRow(data: any) {
    confirmDelete({
        message: `Are you sure you want to delete transport type "${data.name}"?`,
        onAccept: async () => {
            await deleteVehicleType(data.id)
            loadData()
        },
        successMessage: 'Transport type deleted'
    })
}

const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bus')) return 'directions_bus';
    if (n.includes('jeep')) return 'commute';
    if (n.includes('ferry') || n.includes('boat')) return 'directions_boat';
    if (n.includes('train') || n.includes('tram')) return 'tram';
    if (n.includes('taxi')) return 'local_taxi';
    return 'commute';
};
</script>

<template>
    <div class="space-y-6 font-geist">
        <!-- Page Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-3xl font-bold text-on-surface">Transport Types</h2>
                <p class="text-on-surface-variant mt-1">Classify and manage different modes of transportation.</p>
            </div>
            <button v-if="hasPermission('vehicle-type.create')" @click="openNew" class="bg-primary hover:bg-primary-container text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                <span class="material-symbols-outlined text-sm">add</span>
                New Type
            </button>
        </div>

        <!-- Metrics Grid -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="type in vehicleTypes.slice(0, 4)" :key="type.id" class="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex items-center gap-4 hover:border-primary/50 transition-colors">
                <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-2xl">{{ getIcon(type.name) }}</span>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-on-surface">{{ type.name }}</h3>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-on-surface-variant"><b class="text-on-surface">{{ type.routes_count || 0 }}</b> Routes</span>
                        <span class="text-xs text-outline">•</span>
                        <span class="text-xs text-on-surface-variant"><b class="text-on-surface">{{ type.vehicles_count || 0 }}</b> Units</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Table Container -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <AppDataTable 
                :value="vehicleTypes" 
                :loading="loading" 
                v-model:filters="filters" 
                :globalFilterFields="['name']"
                @clear="filters.global.value = null"
                @refresh="loadData"
            >
                <template #empty> No transport types found. </template>
                
                <Column field="name" header="Type Name" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-outline text-[20px]">{{ getIcon(data.name) }}</span>
                            <span class="font-medium text-on-surface">{{ data.name }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="routes_count" header="Active Routes" sortable class="text-center">
                    <template #body="{ data }">
                        <span class="font-mono text-sm bg-surface-container px-2 py-0.5 rounded">{{ data.routes_count || 0 }}</span>
                    </template>
                </Column>

                <Column field="vehicles_count" header="Total Units" sortable class="text-center">
                    <template #body="{ data }">
                        <span class="font-mono text-sm bg-surface-container px-2 py-0.5 rounded">{{ data.vehicles_count || 0 }}</span>
                    </template>
                </Column>

                <Column field="status" header="Status" sortable>
                    <template #body="{ data }">
                        <span 
                            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium text-[10px] uppercase tracking-wider"
                            :class="data.status === 'active' ? 'bg-success/10 text-success' : 'bg-outline-variant/20 text-on-surface-variant'"
                        >
                            <span class="w-1 h-1 rounded-full" :class="data.status === 'active' ? 'bg-success' : 'bg-on-surface-variant'"></span>
                            {{ data.status }}
                        </span>
                    </template>
                </Column>

                <Column header="Actions" class="w-32 text-right">
                    <template #body="{ data }">
                        <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button @click="editRecord(data)" class="text-on-surface-variant hover:text-primary p-1.5 transition-colors">
                                <span class="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button v-if="hasPermission('vehicle-type.delete')" @click="confirmDeleteRow(data)" class="text-on-surface-variant hover:text-error p-1.5 transition-colors">
                                <span class="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </template>
                </Column>
            </AppDataTable>
        </div>

        <Dialog v-model:visible="dialog" :header="isCreate ? 'New Transport Type' : 'Edit Transport Type'" :modal="true" :dismissableMask="true" class="p-fluid sm:w-[500px]">
            <div class="flex flex-col gap-4 mt-4">
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Name</label>
                    <InputText v-model="form.name" :class="{'p-invalid': errors.name}" placeholder="e.g. Modern Jeepney" />
                    <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Status</label>
                    <Select v-model="form.status" :options="statuses" optionLabel="label" optionValue="value" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Description</label>
                    <Textarea v-model="form.description" rows="3" autoResize placeholder="Optional details..." />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2 pt-2">
                    <Button label="Cancel" icon="pi pi-times" text @click="dialog = false" />
                    <Button label="Save Type" icon="pi pi-check" :loading="dialogLoading" @click="saveRecord" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.font-geist {
    font-family: 'Geist', sans-serif;
}
:deep(.p-datatable-tbody > tr) {
    cursor: pointer;
}
</style>
