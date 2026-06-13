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
        
        if (!form.value.name) {
            form.value.name = address.split(',')[0]
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
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load stops' })
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

    mapInstance = L.map(mapContainer.value!, { zoomControl: false }).setView([form.value.latitude, form.value.longitude], 13)
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)

    markerInstance = L.marker([form.value.latitude, form.value.longitude], { 
        draggable: true,
        icon: L.divIcon({
            className: 'custom-stop-marker',
            html: '<div style="background-color: #1e3a8a; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(mapInstance)

    if (isCreate.value && form.value.latitude === 14.5995 && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                form.value.latitude = latitude
                form.value.longitude = longitude
                updateMarker()
                updatePlaceInfo(latitude, longitude)
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
    mapInstance?.setView(latlng, 15)
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

function validate() {
    errors.value = {}
    if (!form.value.name?.trim()) errors.value.name = 'Name is required'
    return Object.keys(errors.value).length === 0
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
            toast.add({ severity: 'success', summary: 'Created', detail: 'Stop created' })
        } else {
            await updateStop(form.value.id!, payload)
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Stop updated' })
        }
        dialog.value = false
        cleanupMap()
        loadData()
    } catch (e) {
        // Errors handled by interceptor
    } finally {
        dialogLoading.value = false
    }
}

function confirmDeleteRow(data: any) {
    confirmDelete({
        message: `Are you sure you want to delete stop "${data.name}"?`,
        onAccept: async () => {
            await deleteStop(data.id)
            loadData()
        },
        successMessage: 'Stop deleted'
    })
}
</script>

<template>
    <div class="space-y-6 font-geist">
        <!-- Page Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-3xl font-bold text-on-surface">Transport Stops</h2>
                <p class="text-on-surface-variant mt-1">Manage physical pickup and drop-off locations.</p>
            </div>
            <button v-if="hasPermission('stop.create')" @click="openNew" class="bg-primary hover:bg-primary-container text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                <span class="material-symbols-outlined text-sm">add</span>
                Add New Stop
            </button>
        </div>

        <!-- Table Container -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <AppDataTable 
                :value="stops" 
                :loading="loading" 
                v-model:filters="filters" 
                :globalFilterFields="['name', 'address']"
                @clear="filters.global.value = null"
                @refresh="loadData"
            >
                <template #empty> No stops found. </template>
                
                <Column field="name" header="Stop Name" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">location_on</span>
                            </div>
                            <span class="font-bold text-on-surface">{{ data.name }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="address" header="Address" sortable>
                    <template #body="{ data }">
                        <span class="text-xs text-on-surface-variant line-clamp-1 max-w-xs">{{ data.address || '-' }}</span>
                    </template>
                </Column>

                <Column field="coords" header="Coordinates">
                    <template #body="{ data }">
                        <span class="font-mono text-[10px] text-outline">{{ parseFloat(data.latitude).toFixed(4) }}, {{ parseFloat(data.longitude).toFixed(4) }}</span>
                    </template>
                </Column>

                <Column header="Actions" class="w-32 text-right">
                    <template #body="{ data }">
                        <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button @click="editRecord(data)" class="text-on-surface-variant hover:text-primary p-1.5 transition-colors">
                                <span class="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button v-if="hasPermission('stop.delete')" @click="confirmDeleteRow(data)" class="text-on-surface-variant hover:text-error p-1.5 transition-colors">
                                <span class="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </template>
                </Column>
            </AppDataTable>
        </div>

        <Dialog v-model:visible="dialog" :header="isCreate ? 'New Transport Stop' : 'Edit Transport Stop'" :modal="true" :dismissableMask="true" @hide="cleanupMap" class="p-fluid sm:w-[900px]">
            <div class="grid grid-cols-12 gap-6 mt-4">
                <div class="col-span-12 lg:col-span-5 space-y-5">
                    <div class="space-y-1">
                        <label class="text-sm font-medium">Stop Name</label>
                        <InputText v-model="form.name" :class="{'p-invalid': errors.name}" placeholder="e.g. Market Plaza" />
                        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                    </div>
                    
                    <div class="space-y-1">
                        <label class="text-sm font-medium">Address Reference</label>
                        <div class="p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                            <p class="text-xs text-on-surface-variant leading-relaxed">{{ form.place_name || 'Pick a point on the map to resolve address...' }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-outline uppercase">Latitude</label>
                            <InputText :value="form.latitude.toFixed(6)" readonly class="!bg-surface-container font-mono text-xs" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-outline uppercase">Longitude</label>
                            <InputText :value="form.longitude.toFixed(6)" readonly class="!bg-surface-container font-mono text-xs" />
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label class="text-sm font-medium">Notes</label>
                        <Textarea v-model="form.description" rows="3" autoResize placeholder="Optional details..." />
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-7 flex flex-col gap-2">
                    <label class="text-sm font-medium flex justify-between items-center">
                        <span>Precise Location</span>
                        <span class="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">Draggable Marker</span>
                    </label>
                    <div class="relative flex-1 min-h-[400px] border border-outline-variant rounded-xl overflow-hidden shadow-inner bg-inverse-surface">
                        <div ref="mapContainer" class="absolute inset-0 z-0"></div>
                        
                        <!-- Map Zoom Controls -->
                        <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                            <button @click="mapInstance?.zoomIn()" class="w-8 h-8 bg-white border border-outline-variant flex items-center justify-center rounded hover:bg-surface-container text-on-surface shadow-sm">
                                <span class="material-symbols-outlined text-[18px]">add</span>
                            </button>
                            <button @click="mapInstance?.zoomOut()" class="w-8 h-8 bg-white border border-outline-variant flex items-center justify-center rounded hover:bg-surface-container text-on-surface shadow-sm">
                                <span class="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2 pt-4 border-t border-outline-variant mt-4">
                    <Button label="Cancel" icon="pi pi-times" text @click="dialog = false" />
                    <Button label="Save Stop" icon="pi pi-check" :loading="dialogLoading" @click="saveRecord" class="px-6" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.font-geist {
    font-family: 'Geist', sans-serif;
}
:deep(.custom-stop-marker) {
    background: transparent;
    border: none;
}
:deep(.p-datatable-tbody > tr) {
    cursor: pointer;
}
</style>
