<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { listRoutes, deleteRoute } from '@/service/vehicles/routes'
import { getVehicleTypeOptions } from '@/service/vehicles/vehicles'
import { usePermissions } from '@/composables/usePermissions'
import { useAppConfirm } from '@/composables/useAppConfirm'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()
const { hasPermission, fetchProfile } = usePermissions()
const { confirmDelete } = useAppConfirm()

const routes = ref<any[]>([])
const loading = ref(false)
const vehicleTypes = ref<any[]>([])

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

async function loadData() {
    loading.value = true
    try {
        const [routesData, typesData] = await Promise.all([
            listRoutes(),
            getVehicleTypeOptions()
        ])
        routes.value = routesData
        vehicleTypes.value = typesData
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load routes' })
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await fetchProfile()
    loadData()
})

function openNew() {
    router.push('/transport/routes/new')
}

function editRecord(data: any) {
    router.push(`/transport/routes/${data.id}/edit`)
}

function confirmDeleteRow(data: any) {
    confirmDelete({
        message: `Are you sure you want to delete route "${data.name}"?`,
        onAccept: async () => {
            await deleteRoute(data.id)
            loadData()
        },
        successMessage: 'Route deleted'
    })
}

const getIcon = (name: string) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('bus')) return 'directions_bus';
    if (n.includes('jeep')) return 'commute';
    if (n.includes('ferry')) return 'directions_boat';
    return 'route';
};
</script>

<template>
    <div class="space-y-6 font-geist">
        <!-- Page Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-3xl font-bold text-on-surface">Transport Routes</h2>
                <p class="text-on-surface-variant mt-1">Manage the logical paths and stop sequences of the network.</p>
            </div>
            <button v-if="hasPermission('route.create')" @click="openNew" class="bg-primary hover:bg-primary-container text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                <span class="material-symbols-outlined text-sm">add</span>
                Create Route
            </button>
        </div>

        <!-- Table Container -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <AppDataTable 
                :value="routes" 
                :loading="loading" 
                v-model:filters="filters" 
                :globalFilterFields="['name', 'code']"
                @clear="filters.global.value = null"
                @refresh="loadData"
            >
                <template #empty> No routes found. </template>
                
                <Column field="code" header="Route ID" sortable>
                    <template #body="{ data }">
                        <span class="font-mono text-xs bg-surface-container px-2 py-1 rounded border border-outline-variant/50">{{ data.code || '-' }}</span>
                    </template>
                </Column>

                <Column field="name" header="Route Name" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-8 rounded-full" :style="{ backgroundColor: data.color || '#ddd' }"></div>
                            <span class="font-bold text-on-surface">{{ data.name }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="vehicle_type.name" header="Mode" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center gap-2 text-on-surface-variant">
                            <span class="material-symbols-outlined text-[18px]">{{ getIcon(data.vehicle_type?.name) }}</span>
                            <span class="text-sm">{{ data.vehicle_type?.name || '-' }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="status" header="Status" sortable>
                    <template #body="{ data }">
                        <span 
                            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium text-[10px] uppercase tracking-wider border"
                            :class="data.status === 'active' ? 'bg-success/5 border-success/20 text-success' : 'bg-outline-variant/10 border-outline-variant text-on-surface-variant'"
                        >
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
                            <button v-if="hasPermission('route.delete')" @click="confirmDeleteRow(data)" class="text-on-surface-variant hover:text-error p-1.5 transition-colors">
                                <span class="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </template>
                </Column>
            </AppDataTable>
        </div>
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
