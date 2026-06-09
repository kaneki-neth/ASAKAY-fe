<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { listStops, createStop, updateStop, deleteStop } from '@/service/vehicles/stops'
import { usePermissions } from '@/composables/usePermissions'
import { useAppConfirm } from '@/composables/useAppConfirm'
import * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'

const L = (Leaflet as any).default || Leaflet
const toast = useToast()
const { hasPermission, fetchProfile } = usePermissions()
const { confirmDelete } = useAppConfirm()

const stops = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const dialogLoading = ref(false)

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const initialForm = {
    id: null,
    name: '',
    latitude: 14.5995, // Manila Default
    longitude: 120.9842,
    place_name: '',
    description: ''
}

const form = ref({ ...initialForm })
const errors = ref<Record<string, string>>({})
const isCreate = ref(true)

async function updatePlaceInfo(lat: number, lng: number) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'en' }
        })
        const data = await res.json()
        const address = data.display_name || 'Selected Location'
        
        form.value.place_name = address
        
        // Only auto-fill the stop name if it's currently empty (suggesting a name)
        if (!form.value.name) {
            form.value.name = address.split(',')[0] // Take the first part of the address as a suggestion
        }
    } catch (e) {
        form.value.place_name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
}

// Map related
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: any = null
let markerInstance: any = null

async function loadData() {
    loading.value = true
    try {
        stops.value = await listStops()
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load stops', life: 3000 })
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await fetchProfile()
    loadData()
})

function initMap() {
    if (mapInstance) return

    mapInstance = L.map(mapContainer.value!).setView([form.value.latitude, form.value.longitude], 13)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)

    markerInstance = L.marker([form.value.latitude, form.value.longitude], { draggable: true }).addTo(mapInstance)

    // Attempt to get user's current location if creating a new stop and haven't manually picked a location
    if (isCreate.value && form.value.latitude === 14.5995 && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                form.value.latitude = latitude
                form.value.longitude = longitude
                updateMarker()
                updatePlaceInfo(latitude, longitude)
            },
            (error) => {
                console.warn('Geolocation failed or denied:', error.message)
            }
        )
    }

    markerInstance.on('dragend', async (event: any) => {
        const position = event.target.getLatLng()
        form.value.latitude = position.lat
        form.value.longitude = position.lng
        await updatePlaceInfo(position.lat, position.lng)
    })

    mapInstance.on('click', async (event: any) => {
        const position = event.latlng
        form.value.latitude = position.lat
        form.value.longitude = position.lng
        markerInstance?.setLatLng(position)
        await updatePlaceInfo(position.lat, position.lng)
    })
}

function updateMarker() {
    const latlng = L.latLng(form.value.latitude, form.value.longitude)
    markerInstance?.setLatLng(latlng)
    mapInstance?.setView(latlng)
}

function openNew() {
    isCreate.value = true
    form.value = { ...initialForm }
    errors.value = {}
    dialog.value = true
    nextTick(async () => {
        initMap()
        updateMarker()
        await updatePlaceInfo(form.value.latitude, form.value.longitude)
    })
}

function editRecord(data: any) {
    isCreate.value = false
    form.value = {
        id: data.id,
        name: data.name,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        place_name: data.address || 'Loading address...',
        description: data.description || ''
    }
    errors.value = {}
    dialog.value = true
    nextTick(async () => {
        initMap()
        updateMarker()
        if (!data.address) {
            await updatePlaceInfo(form.value.latitude, form.value.longitude)
        }
    })
}

function cleanupMap() {
    if (mapInstance) {
        mapInstance.remove()
        mapInstance = null
        markerInstance = null
    }
}

function hideDialog() {
    dialog.value = false
    cleanupMap()
}

function validate() {
    errors.value = {}
    if (!form.value.name?.trim()) errors.value.name = 'Name is required'
    return Object.keys(errors.value).length === 0
}

function clearError(field: string) {
    if (errors.value[field]) delete errors.value[field]
}

async function saveRecord() {
    if (!validate()) return

    dialogLoading.value = true
    try {
        const payload = {
            ...form.value,
            address: form.value.place_name
        }

        if (isCreate.value) {
            await createStop(payload)
            toast.add({ severity: 'success', summary: 'Created', detail: 'Stop created successfully', life: 2500 })
        } else {
            await updateStop(form.value.id!, payload)
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Stop updated successfully', life: 2500 })
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
        }
    } finally {
        dialogLoading.value = false
    }
}

function confirmDeleteRow(data: any) {
    confirmDelete({
        message: `Are you sure you want to delete stop "${data.name}"?`,
        header: 'Confirm Delete',
        onAccept: async () => {
            await deleteStop(data.id)
            loadData()
        },
        successMessage: 'Stop deleted'
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
        <div class="font-semibold text-xl mb-4">Transport Stops</div>
        
        <AppDataTable 
            :value="stops" 
            :loading="loading" 
            v-model:filters="filters" 
            :globalFilterFields="['name', 'address']"
            @clear="clearFilter"
            @refresh="loadData"
        >
            <template #actions>
                <Button v-if="hasPermission('stop.create')" label="New Stop" icon="pi pi-plus" @click="openNew" />
            </template>
            
            <Column field="name" header="Name" sortable></Column>
            <Column field="address" header="Address" sortable>
                <template #body="{ data }">
                    {{ data.address || '-' }}
                </template>
            </Column>
            <Column field="description" header="Description">
                <template #body="{ data }">
                    {{ data.description || '-' }}
                </template>
            </Column>
            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                <template #body="{ data }">
                    <Button v-if="hasPermission('stop.update')" icon="pi pi-pencil" rounded outlined class="mr-2" @click="editRecord(data)" />
                    <Button v-if="hasPermission('stop.delete')" icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteRow(data)" />
                </template>
            </Column>
        </AppDataTable>

        <Dialog v-model:visible="dialog" :header="isCreate ? 'New Stop' : 'Edit Stop'" :modal="true" :dismissableMask="true" @hide="cleanupMap" class="p-fluid sm:w-[800px]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="name">Stop Name</label>
                        <InputText id="name" v-model="form.name" :class="{'p-invalid': errors.name}" placeholder="e.g. Market Plaza Entrance" @input="clearError('name')" />
                        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="place_name">Location Address</label>
                        <Textarea id="place_name" v-model="form.place_name" rows="2" readonly class="bg-gray-50 italic text-sm" placeholder="Pick a point on the map..." />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="description">Notes / Description</label>
                        <Textarea id="description" v-model="form.description" rows="3" autoResize placeholder="Optional details about this stop" />
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <label>Location Picker</label>
                    <div ref="mapContainer" style="height: 350px; border-radius: 6px; border: 1px solid #ddd;"></div>
                    <small class="text-gray-500">Click on the map or drag the marker to set location.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" :loading="dialogLoading" @click="saveRecord" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Fix Leaflet marker display issue in some environments */
:deep(.leaflet-pane) {
    z-index: 1 !important;
}
:deep(.leaflet-top), :deep(.leaflet-bottom) {
    z-index: 2 !important;
}
</style>
