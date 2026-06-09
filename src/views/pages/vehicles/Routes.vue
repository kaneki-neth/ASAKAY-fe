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
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load routes', life: 3000 })
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
        header: 'Confirm Delete',
        onAccept: async () => {
            await deleteRoute(data.id)
            loadData()
        },
        successMessage: 'Route deleted'
    })
}

function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    }
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Transport Routes</div>
        
        <AppDataTable 
            :value="routes" 
            :loading="loading" 
            v-model:filters="filters" 
            :globalFilterFields="['name', 'code']"
            @clear="clearFilter"
            @refresh="loadData"
        >
            <template #actions>
                <Button v-if="hasPermission('route.create')" label="New Route" icon="pi pi-plus" @click="openNew" />
            </template>
            
            <Column field="code" header="Code" sortable></Column>
            <Column field="name" header="Name" sortable></Column>
            <Column field="vehicle_type.name" header="Type" sortable>
                <template #body="{ data }">
                    {{ data.vehicle_type?.name || '-' }}
                </template>
            </Column>
            <Column field="color" header="Color">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <div :style="{ backgroundColor: data.color, width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #ddd' }"></div>
                        <span class="font-mono text-xs">{{ data.color }}</span>
                    </div>
                </template>
            </Column>
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="data.status === 'active' ? 'success' : 'danger'" />
                </template>
            </Column>
            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                <template #body="{ data }">
                    <Button v-if="hasPermission('route.update')" icon="pi pi-pencil" rounded outlined class="mr-2" @click="editRecord(data)" />
                    <Button v-if="hasPermission('route.delete')" icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteRow(data)" />
                </template>
            </Column>
        </AppDataTable>
    </div>
</template>
