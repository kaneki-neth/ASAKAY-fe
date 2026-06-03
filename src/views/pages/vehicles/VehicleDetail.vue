<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getVehicle } from '@/service/vehicles'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const router = useRouter()
const { hasPermission, fetchProfile } = usePermissions()

const loading = ref(true)
const vehicle = ref<any>(null)

onMounted(async () => {
    await fetchProfile()
    loading.value = true
    try {
        const data = await getVehicle(route.params.id as string)
        vehicle.value = data
    } catch (e) {
        // Error handled by interceptor
    } finally {
        loading.value = false
    }
})

function back() {
    router.push('/transport/vehicles')
}

function edit() {
    router.push(`/transport/vehicles/${route.params.id}/edit`)
}

function formatDate(value: any) {
    const d = value ? new Date(value) : null
    return d ? d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
}

function getStatusSeverity(status: string) {
    switch (status) {
        case 'Active': return 'success'
        case 'Inactive': return 'danger'
        case 'Maintenance': return 'warn'
        default: return null
    }
}
</script>

<template>
    <div class="card mx-auto">
        <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-xl">Vehicle Details</div>
            <Tag v-if="vehicle" :value="vehicle.status" :severity="getStatusSeverity(vehicle.status)" />
        </div>

        <div v-if="loading" class="space-y-4">
            <Skeleton height="2rem" width="60%"></Skeleton>
            <Skeleton height="1.5rem"></Skeleton>
            <Skeleton height="1.5rem"></Skeleton>
            <Skeleton height="5rem"></Skeleton>
        </div>

        <div v-else-if="vehicle">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Vehicle Name</span>
                    <span class="font-medium text-lg">{{ vehicle.name }}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Vehicle Code</span>
                    <span class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-primary w-fit">{{ vehicle.code }}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Transport Type</span>
                    <span class="font-medium">{{ vehicle.type }}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Created By</span>
                    <span class="font-medium">{{ vehicle.creator?.name || 'System' }}</span>
                </div>
                <div class="flex flex-col gap-1 md:col-span-2">
                    <span class="text-gray-500 text-sm">Description</span>
                    <p class="mt-1 leading-relaxed text-gray-700 dark:text-gray-300">
                        {{ vehicle.description || 'No description provided.' }}
                    </p>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Created At</span>
                    <span class="text-sm">{{ formatDate(vehicle.created_at) }}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Last Updated</span>
                    <span class="text-sm">{{ formatDate(vehicle.updated_at) }}</span>
                </div>
            </div>

            <div class="mt-8 flex gap-2 border-t pt-6 border-gray-100 dark:border-gray-800">
                <Button label="Back to List" icon="pi pi-arrow-left" severity="secondary" outlined @click="back" />
                <Button v-if="hasPermission('can_edit_vehicles')" label="Edit Vehicle" icon="pi pi-pencil" @click="edit" />
            </div>
        </div>

        <div v-else class="text-center py-8">
            <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-4"></i>
            <p>Vehicle not found or an error occurred.</p>
            <Button label="Back to List" link @click="back" />
        </div>
    </div>
</template>
