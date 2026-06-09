<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { createRoute, getRoute, updateRoute } from '@/service/vehicles/routes'
import { getVehicleTypeOptions } from '@/service/vehicles/vehicles'
import { getAllStops } from '@/service/vehicles/stops'
import { usePermissions } from '@/composables/usePermissions'
import * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'

const L = (Leaflet as any).default || Leaflet
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { fetchProfile } = usePermissions()

const id = computed(() => route.params.id as string | undefined)
const isCreate = computed(() => !id.value)
const loading = ref(false)
const saving = ref(false)
const snapToRoad = ref(true)

const vehicleTypes = ref<any[]>([])
const availableStops = ref<any[]>([])
const suggestedStops = ref<any[]>([])

const form = ref({
    name: '',
    code: '',
    vehicle_type_id: null as number | null,
    color: '#3B82F6',
    status: 'active',
    polyline: [] as { lat: number, lng: number }[],
    stops: [] as any[] // Sequenced stops
})

// Points actually clicked by the user (for undo/logic)
const userClicks = ref<{ lat: number, lng: number }[]>([])

const errors = ref<Record<string, string>>({})

// Helper for coordinate distance (meters)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

// Check if a point is near the route polyline
function isPointNearRoute(lat: number, lng: number, thresholdMeters = 500) {
    if (form.value.polyline.length === 0) return false
    
    // Check distance to every point in high-res polyline
    return form.value.polyline.some(p => getDistance(lat, lng, p.lat, p.lng) <= thresholdMeters)
}

// Map related
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: any = null
let polylineLayer: any = null
let pointMarkers: any[] = []
let stopMarkers: any[] = []

async function loadData() {
    loading.value = true
    try {
        const [types, stops] = await Promise.all([
            getVehicleTypeOptions(),
            getAllStops()
        ])
        vehicleTypes.value = types
        availableStops.value = stops

        if (id.value) {
            const data = await getRoute(id.value)
            form.value = {
                name: data.name,
                code: data.code,
                vehicle_type_id: data.vehicle_type_id,
                color: data.color || '#3B82F6',
                status: data.status,
                polyline: data.polyline || [],
                stops: data.stops || []
            }
            // For existing routes, we treat the saved polyline as the clicks for now
            userClicks.value = data.polyline || []
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 })
    } finally {
        loading.value = false
        nextTick(() => initMap())
    }
}

onMounted(async () => {
    await fetchProfile()
    loadData()
})

function initMap() {
    if (!mapContainer.value || mapInstance) return

    const defaultCenter: any = [14.5995, 120.9842]
    const initialCenter: any = form.value.polyline.length > 0 
        ? [form.value.polyline[0].lat, form.value.polyline[0].lng]
        : defaultCenter

    mapInstance = L.map(mapContainer.value).setView(initialCenter, 13)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)

    // Attempt to get user's current location if creating a new route
    if (isCreate.value && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                mapInstance?.setView([latitude, longitude], 15)
            },
            (error) => {
                console.warn('Geolocation failed or denied:', error.message)
            }
        )
    }

    polylineLayer = L.polyline([], { color: form.value.color }).addTo(mapInstance)

    mapInstance.on('click', async (e: any) => {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng }
        userClicks.value.push(newPoint)
        await recalculatePath()
    })

    updateMapElements()
}

async function recalculatePath() {
    if (userClicks.value.length === 0) {
        form.value.polyline = []
        updateMapElements()
        return
    }

    if (userClicks.value.length === 1) {
        form.value.polyline = [...userClicks.value]
        updateMapElements()
        return
    }

    if (!snapToRoad.value) {
        form.value.polyline = [...userClicks.value]
    } else {
        // Fetch from OSRM
        try {
            const coords = userClicks.value.map(p => `${p.lng},${p.lat}`).join(';')
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
            const data = await res.json()
            
            if (data.routes && data.routes.length > 0) {
                // Convert GeoJSON [lng, lat] to {lat, lng}
                form.value.polyline = data.routes[0].geometry.coordinates.map((c: any) => ({
                    lat: c[1],
                    lng: c[0]
                }))
            } else {
                // Fallback to linear if OSRM fails
                form.value.polyline = [...userClicks.value]
            }
        } catch (e) {
            console.error('OSRM Fetch Error:', e)
            form.value.polyline = [...userClicks.value]
        }
    }
    updateMapElements()
    detectSuggestedStops()
}

function undoLastPoint() {
    userClicks.value.pop()
    recalculatePath()
}

function updateMapElements() {
    if (!mapInstance || !polylineLayer) return

    // Ensure color has # prefix for Leaflet
    let color = form.value.color || '#3B82F6'
    if (!color.startsWith('#')) {
        color = '#' + color
    }

    // Update Polyline
    const path = form.value.polyline.map(p => [p.lat, p.lng])
    polylineLayer.setLatLngs(path)
    polylineLayer.setStyle({ color: color })

    // Update Point Markers (Only for actual clicks to keep map clean)
    pointMarkers.forEach(m => m.remove())
    pointMarkers = []
    userClicks.value.forEach((p, index) => {
        const m = L.marker([p.lat, p.lng], { 
            draggable: true,
            icon: L.divIcon({
                className: 'custom-anchor-icon',
                html: `<div style="background-color: #EF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(mapInstance)
        
        m.on('dragend', async (event: any) => {
            const newPos = event.target.getLatLng()
            userClicks.value[index] = { lat: newPos.lat, lng: newPos.lng }
            await recalculatePath()
        })

        m.bindPopup(`Anchor ${index + 1} <br/> <button class="p-button p-button-text p-button-sm text-red-500" onclick="window.removeRoutePoint(${index})">Remove Anchor</button>`)
        pointMarkers.push(m)
    })

    // Update Stop Markers
    stopMarkers.forEach(m => m.remove())
    stopMarkers = []
    form.value.stops.forEach((stop, index) => {
        const m = L.marker([stop.latitude, stop.longitude], {
            icon: L.divIcon({
                className: 'custom-stop-icon',
                html: `<div style="background-color: white; border: 2px solid ${color}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: ${color}">${index + 1}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(mapInstance)
        m.bindTooltip(stop.name)
        stopMarkers.push(m)
    })

    // Expose remove function to window for the popup
    ;(window as any).removeRoutePoint = (index: number) => {
        userClicks.value.splice(index, 1)
        recalculatePath()
    }
}

function detectSuggestedStops() {
    if (form.value.polyline.length === 0) {
        suggestedStops.value = []
        return
    }

    // Find stops within 100m of the path that aren't already added
    const currentStopIds = form.value.stops.map(s => s.id)
    suggestedStops.value = availableStops.value.filter(stop => {
        if (currentStopIds.includes(stop.id)) return false
        return isPointNearRoute(stop.latitude, stop.longitude, 100)
    })
}

function clearPath() {
    userClicks.value = []
    form.value.polyline = []
    suggestedStops.value = []
    updateMapElements()
}

function addStopToRoute(stop: any) {
    if (!stop) return

    // 1. Check if already added
    if (form.value.stops.find(s => s.id === stop.id)) return

    // 2. Validate distance from route (Allow 500m margin)
    if (!isPointNearRoute(stop.latitude, stop.longitude, 500)) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Stop Too Far', 
            detail: `"${stop.name}" is not along the drawn route path. Please add stops that are relevant to this area.`,
            life: 5000 
        })
        return
    }

    form.value.stops.push(stop)
    detectSuggestedStops()
    updateMapElements()
}

function removeStopFromRoute(index: number) {
    form.value.stops.splice(index, 1)
    detectSuggestedStops()
    updateMapElements()
}

function validate() {
    errors.value = {}
    if (!form.value.name?.trim()) errors.value.name = 'Name is required'
    if (!form.value.code?.trim()) errors.value.code = 'Code is required'
    if (!form.value.vehicle_type_id) errors.value.vehicle_type_id = 'Type is required'
    return Object.keys(errors.value).length === 0
}

async function save() {
    if (!validate()) return

    saving.value = true
    try {
        const payload = {
            ...form.value,
            stops: form.value.stops.map(s => s.id)
        }

        if (id.value) {
            await updateRoute(id.value, payload)
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Route updated successfully', life: 2500 })
        } else {
            await createRoute(payload)
            toast.add({ severity: 'success', summary: 'Created', detail: 'Route created successfully', life: 2500 })
        }
        router.push('/transport/routes')
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
        saving.value = false
    }
}

function cancel() {
    router.push('/transport/routes')
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">{{ isCreate ? 'New Route' : 'Edit Route' }}</div>

        <div v-if="loading" class="p-4 text-center">
            <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>

        <form v-else @submit.prevent="save" class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Left: Basic Info -->
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="name">Route Name</label>
                    <InputText id="name" v-model="form.name" :class="{'p-invalid': errors.name}" placeholder="e.g. Route 01: Downtown - Pier" />
                    <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="code">Route Code</label>
                    <InputText id="code" v-model="form.code" :class="{'p-invalid': errors.code}" placeholder="e.g. R01" />
                    <small v-if="errors.code" class="p-error">{{ errors.code }}</small>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="type">Vehicle Type</label>
                    <Select id="type" v-model="form.vehicle_type_id" :options="vehicleTypes" optionLabel="name" optionValue="id" placeholder="Select Type" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="color">UI Color</label>
                    <div class="flex gap-2 items-center">
                        <ColorPicker v-model="form.color" @change="updateMapElements" />
                        <InputText v-model="form.color" class="font-mono text-sm" @input="updateMapElements" />
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="status">Status</label>
                    <Select id="status" v-model="form.status" :options="[{label: 'Active', value: 'active'}, {label: 'Inactive', value: 'inactive'}]" optionLabel="label" optionValue="value" />
                </div>

                <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="font-semibold mb-2 flex justify-between items-center">
                        <span>Route Stops (Sequence)</span>
                        <small>{{ form.stops.length }} stops</small>
                    </div>
                    
                    <div v-if="form.stops.length === 0" class="text-sm text-gray-500 italic py-4 text-center border-2 border-dashed border-gray-300 rounded">
                        No stops added yet. Select from the list below.
                    </div>

                    <ul class="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                        <li v-for="(stop, index) in form.stops" :key="stop.id" class="flex items-center gap-3 p-2 bg-white dark:bg-gray-900 rounded border shadow-sm group">
                            <span class="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{{ index + 1 }}</span>
                            <span class="flex-1 text-sm truncate">{{ stop.name }}</span>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button icon="pi pi-arrow-up" text rounded size="small" :disabled="index === 0" @click="form.stops.splice(index-1, 0, form.stops.splice(index, 1)[0]); updateMapElements()" />
                                <Button icon="pi pi-arrow-down" text rounded size="small" :disabled="index === form.stops.length - 1" @click="form.stops.splice(index+1, 0, form.stops.splice(index, 1)[0]); updateMapElements()" />
                                <Button icon="pi pi-times" text rounded severity="danger" size="small" @click="removeStopFromRoute(index)" />
                            </div>
                        </li>
                    </ul>

                    <div class="mt-4">
                        <label class="text-xs font-bold text-gray-500 uppercase">Available Stops</label>
                        <Select :options="availableStops" filter optionLabel="name" placeholder="Search and add a stop" class="w-full mt-1" @change="(e) => addStopToRoute(e.value)" />
                    </div>

                    <!-- Suggested Stops Section -->
                    <div v-if="suggestedStops.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <label class="text-xs font-bold text-primary uppercase flex items-center gap-1">
                            <i class="pi pi-sparkles"></i> Suggested Stops
                        </label>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <Button 
                                v-for="stop in suggestedStops" 
                                :key="stop.id" 
                                :label="stop.name" 
                                icon="pi pi-plus" 
                                size="small" 
                                severity="success" 
                                outlined 
                                @click="addStopToRoute(stop)" 
                            />
                        </div>
                        <small class="text-gray-500 mt-1 block">Found these stops along your drawn path.</small>
                    </div>
                </div>
            </div>

            <!-- Right: Map and Pathing -->
            <div class="xl:col-span-2 flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <label class="font-semibold text-lg text-primary">Route Path Drawing</label>
                        <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                            <span class="text-xs font-bold uppercase text-gray-500">Snap to Road</span>
                            <ToggleSwitch v-model="snapToRoad" @change="recalculatePath" />
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <Button label="Clear Path" icon="pi pi-trash" severity="secondary" text size="small" @click="clearPath" />
                        <Button label="Undo" icon="pi pi-undo" severity="secondary" text size="small" :disabled="userClicks.length === 0" @click="undoLastPoint" />
                    </div>
                </div>
                
                <div ref="mapContainer" style="height: 600px; border-radius: 8px; border: 1px solid #ddd; position: relative; overflow: hidden;"></div>
                
                <div class="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg flex gap-3 border border-blue-100 dark:border-blue-800">
                    <i class="pi pi-info-circle text-lg"></i>
                    <div>
                        <strong>How to draw:</strong> Click on the map to add points to the route's path. These define the visual line users will see. 
                        <strong>Stops:</strong> Use the sidebar on the left to sequence the official pickup/dropoff points.
                    </div>
                </div>

                <div class="flex gap-2 mt-4">
                    <Button type="submit" label="Save Route" icon="pi pi-check" :loading="saving" />
                    <Button type="button" label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="cancel" />
                </div>
            </div>
        </form>
    </div>
</template>

<style scoped>
:deep(.leaflet-pane) {
    z-index: 1 !important;
}
:deep(.leaflet-top), :deep(.leaflet-bottom) {
    z-index: 2 !important;
}
:deep(.custom-stop-icon) {
    background: transparent;
    border: none;
}
</style>
