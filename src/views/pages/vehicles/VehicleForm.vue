<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createVehicle, getVehicle, updateVehicle } from '@/service/vehicles'
import { useToast } from 'primevue/usetoast'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { fetchProfile } = usePermissions()

const id = computed(() => route.params.id as string | undefined)
const isCreate = computed(() => !id.value)
const loading = ref(false)

const vehicleTypes = [
    { label: 'Jeepney', value: 'jeepney' },
    { label: 'Bus', value: 'bus' },
    { label: 'Van', value: 'van' }
]

const statuses = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
]

const form = ref({
    name: '',
    code: '',
    type: null,
    status: 'active',
    description: ''
})

const errors = ref<Record<string, string>>({})

onMounted(async () => {
    await fetchProfile()
    
    if (id.value) {
        loading.value = true
        try {
            const data = await getVehicle(id.value)
            form.value = {
                name: data?.name ?? '',
                code: data?.code ?? '',
                type: data?.type ?? null,
                status: data?.status ?? 'active',
                description: data?.description ?? ''
            }
        } catch (e) {
            // Error handled by interceptor
        } finally {
            loading.value = false
        }
    }
})

function validate() {
    errors.value = {}
    if (!form.value.name?.trim()) errors.value.name = 'Name is required'
    if (!form.value.code?.trim()) errors.value.code = 'Code is required'
    if (!form.value.type) errors.value.type = 'Vehicle type is required'
    if (!form.value.status) errors.value.status = 'Status is required'
    
    return Object.keys(errors.value).length === 0
}

function clearError(field: string) {
    if (errors.value[field]) delete errors.value[field]
}

async function save() {
    if (!validate()) return

    loading.value = true
    try {
        if (id.value) {
            await updateVehicle(id.value, form.value)
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Vehicle updated successfully', life: 2500 })
        } else {
            await createVehicle(form.value)
            toast.add({ severity: 'success', summary: 'Created', detail: 'Vehicle created successfully', life: 2500 })
        }
        router.push('/transport/vehicles')
    } catch (e: any) {
        const errs = e?.response?.data?.errors
        if (errs && typeof errs === 'object') {
            const m: Record<string, string> = {}
            Object.keys(errs).forEach(k => {
                const v = (errs as any)[k]
                m[k] = Array.isArray(v) ? v[0] : String(v)
            })
            errors.value = m
        }
    } finally {
        loading.value = false
    }
}

function cancel() {
    router.push('/transport/vehicles')
}
</script>

<template>
    <div class="card mx-auto">
        <div class="font-semibold text-xl mb-4">{{ isCreate ? 'New Vehicle' : 'Edit Vehicle' }}</div>
        
        <form @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
                <label for="name">Name</label>
                <InputText id="name" v-model="form.name" :class="{'p-invalid': errors.name}" placeholder="e.g. Blue Jeepney #12" @input="clearError('name')" />
                <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
            </div>

            <div class="flex flex-col gap-2">
                <label for="code">Code</label>
                <InputText id="code" v-model="form.code" :class="{'p-invalid': errors.code}" placeholder="e.g. JEEP-001" @input="clearError('code')" />
                <small v-if="errors.code" class="p-error">{{ errors.code }}</small>
            </div>

            <div class="flex flex-col gap-2">
                <label for="type">Type</label>
                <Select id="type" v-model="form.type" :options="vehicleTypes" optionLabel="label" optionValue="value" placeholder="Select Type" :class="{'p-invalid': errors.type}" @change="clearError('type')" />
                <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
            </div>

            <div class="flex flex-col gap-2">
                <label for="status">Status</label>
                <Select id="status" v-model="form.status" :options="statuses" optionLabel="label" optionValue="value" placeholder="Select Status" :class="{'p-invalid': errors.status}" @change="clearError('status')" />
                <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
            </div>

            <div class="flex flex-col gap-2 lg:col-span-2">
                <label for="description">Description</label>
                <Textarea id="description" v-model="form.description" rows="3" autoResize placeholder="Enter optional details about the vehicle" />
            </div>

            <div class="flex gap-2 mt-4 lg:col-span-2">
                <Button type="submit" label="Save" icon="pi pi-check" :loading="loading" />
                <Button type="button" label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="cancel" />
            </div>
        </form>
    </div>
</template>
