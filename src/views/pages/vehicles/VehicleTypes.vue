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

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    }
}

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

function clearFilter() {
    initFilters()
}

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

function hideDialog() {
    dialog.value = false
}

function validate() {
    errors.value = {}
    if (!form.value.name?.trim()) errors.value.name = 'Name is required'
    if (!form.value.status) errors.value.status = 'Status is required'
    return Object.keys(errors.value).length === 0
}

function clearError(field: string) {
    if (errors.value[field]) delete errors.value[field]
}

async function saveRecord() {
    if (!validate()) return

    dialogLoading.value = true
    try {
        if (isCreate.value) {
            await createVehicleType(form.value)
            toast.add({ severity: 'success', summary: 'Created', detail: 'Vehicle type created', life: 2500 })
        } else {
            await updateVehicleType(form.value.id!, form.value)
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Vehicle type updated', life: 2500 })
        }
        hideDialog()
        loadData()
    } catch (e: any) {
        const errs = e?.response?.data?.errors
        if (errs) {
            const m: Record<string, string> = {}
            Object.keys(errs).forEach(k => {
                m[k] = Array.isArray(errs[k]) ? errs[k][0] : String(errs[k])
            })
            errors.value = m
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'Action failed', life: 3000 })
        }
    } finally {
        dialogLoading.value = false
    }
}

function confirmDeleteRow(data: any) {
    confirmDelete({
        message: `Are you sure you want to delete "${data.name}"?`,
        header: 'Confirm Delete',
        onAccept: async () => {
            await deleteVehicleType(data.id)
            loadData()
        },
        successMessage: 'Vehicle type deleted'
    })
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Vehicle Types</div>
        
        <AppDataTable 
            :value="vehicleTypes" 
            :loading="loading" 
            :filters="filters" 
            :globalFilterFields="['name']"
            @clear="clearFilter"
            @refresh="loadData"
        >
            <template #actions>
                <Button v-if="hasPermission('vehicle-type.create')" label="New" icon="pi pi-plus" @click="openNew" />
            </template>
            
            <Column field="name" header="Name" sortable></Column>
            <Column field="description" header="Description">
                <template #body="{ data }">
                    {{ data.description || '-' }}
                </template>
            </Column>
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="data.status === 'active' ? 'success' : 'danger'" />
                </template>
            </Column>
            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                <template #body="{ data }">
                    <Button v-if="hasPermission('vehicle-type.update')" icon="pi pi-pencil" rounded outlined class="mr-2" @click="editRecord(data)" />
                    <Button v-if="hasPermission('vehicle-type.delete')" icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteRow(data)" />
                </template>
            </Column>
        </AppDataTable>

        <Dialog v-model:visible="dialog" :header="isCreate ? 'New Vehicle Type' : 'Edit Vehicle Type'" :modal="true" :dismissableMask="true" class="p-fluid sm:w-[500px]">
            <div class="flex flex-col gap-4 mt-4">
                <div class="flex flex-col gap-2">
                    <label for="name">Name</label>
                    <InputText id="name" v-model="form.name" :class="{'p-invalid': errors.name}" @input="clearError('name')" />
                    <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                </div>
                <div class="flex flex-col gap-2">
                    <label for="status">Status</label>
                    <Select id="status" v-model="form.status" :options="statuses" optionLabel="label" optionValue="value" :class="{'p-invalid': errors.status}" @change="clearError('status')" />
                    <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
                </div>
                <div class="flex flex-col gap-2">
                    <label for="description">Description</label>
                    <Textarea id="description" v-model="form.description" rows="3" autoResize />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" :loading="dialogLoading" @click="saveRecord" />
            </template>
        </Dialog>
    </div>
</template>
