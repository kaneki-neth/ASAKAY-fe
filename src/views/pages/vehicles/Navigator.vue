<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/service/api'
import * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'

const L = (Leaflet as any).default || Leaflet

const toast = useToast()

const loading = ref(false)
const itineraries = ref<any[]>([])
const selectedItinerary = ref<any>(null)

const origin = ref<{ lat: number, lng: number, name?: string } | null>(null)
const destination = ref<{ lat: number, lng: number, name?: string } | null>(null)

async function reverseGeocode(lat: number, lng: number) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'en' }
        })
        const data = await res.json()
        return data.display_name || 'Selected Location'
    } catch (e) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
}

// Map related
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: any = null
let originMarker: any = null
let destMarker: any = null
let routeLayers: any = null

onMounted(() => {
    initMap()
})

function initMap() {
    if (!mapContainer.value || mapInstance) return

    try {
        // Default Center
        const defaultCenter: L.LatLngTuple = [14.5995, 120.9842]
        
        mapInstance = L.map(mapContainer.value).setView(defaultCenter, 13)
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance)

        // Attempt to get user's current location
        if (navigator.geolocation) {
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

        routeLayers = L.layerGroup().addTo(mapInstance)

        mapInstance.on('click', (e: any) => {
            if (!origin.value) {
                setOrigin(e.latlng.lat, e.latlng.lng)
            } else if (!destination.value) {
                setDestination(e.latlng.lat, e.latlng.lng)
            }
        })
    } catch (error) {
        console.error('Failed to initialize map:', error);
    }
}

async function setOrigin(lat: number, lng: number) {
    origin.value = { lat, lng, name: 'Loading address...' }
    if (originMarker) originMarker.remove()
    originMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color: #10B981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        })
    }).addTo(mapInstance)
    
    origin.value.name = await reverseGeocode(lat, lng)
    checkAndNavigate()
}

async function setDestination(lat: number, lng: number) {
    destination.value = { lat, lng, name: 'Loading address...' }
    if (destMarker) destMarker.remove()
    destMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color: #EF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        })
    }).addTo(mapInstance)
    
    destination.value.name = await reverseGeocode(lat, lng)
    checkAndNavigate()
}

function resetPoints() {
    origin.value = null
    destination.value = null
    if (originMarker) originMarker.remove()
    if (destMarker) destMarker.remove()
    itineraries.value = []
    selectedItinerary.value = null
    routeLayers?.clearLayers()
}

async function checkAndNavigate() {
    if (origin.value && destination.value) {
        loading.value = true
        try {
            const res = await api.post('/navigate', {
                origin_lat: origin.value.lat,
                origin_lng: origin.value.lng,
                dest_lat: destination.value.lat,
                dest_lng: destination.value.lng
            })
            itineraries.value = res.data?.data ?? []
            if (itineraries.value.length > 0) {
                selectItinerary(itineraries.value[0])
            }
        } catch (e: any) {
            toast.add({ severity: 'info', summary: 'No Routes', detail: e?.response?.data?.message || 'Try selecting points near major roads.', life: 3000 })
        } finally {
            loading.value = false
        }
    }
}

function selectItinerary(iti: any) {
    selectedItinerary.value = iti
    drawItinerary(iti)
}

function drawItinerary(iti: any) {
    if (!mapInstance || !routeLayers) return
    routeLayers.clearLayers()

    const bounds: any[] = []

    iti.segments.forEach((seg: any) => {
        if (seg.type === 'walk') {
            const line = L.polyline([[seg.start.lat, seg.start.lng], [seg.end.lat, seg.end.lng]], {
                color: '#94A3B8',
                dashArray: '5, 10',
                weight: 3
            }).addTo(routeLayers!)
            bounds.push([seg.start.lat, seg.start.lng])
            bounds.push([seg.end.lat, seg.end.lng])
        } else if (seg.type === 'ride' && seg.polyline) {
            const path = seg.polyline.map((p: any) => [p.lat, p.lng])
            L.polyline(path, {
                color: seg.route_color,
                weight: 6,
                opacity: 0.8
            }).addTo(routeLayers!)
            path.forEach((p: any) => bounds.push(p))
        }
    })

    if (bounds.length > 0) {
        mapInstance.fitBounds(bounds, { padding: [50, 50] })
    }
}
</script>

<template>
    <div class="card h-[calc(100vh-9rem)] flex flex-col overflow-hidden p-0">
        <div class="flex h-full">
            <!-- Sidebar -->
            <div class="w-full md:w-80 border-r dark:border-gray-700 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                <div class="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div class="font-bold text-lg mb-3">Public Transport Navigator</div>
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            <div class="w-2 h-2 rounded-full bg-green-500"></div>
                            <div class="text-xs truncate flex-1" :title="origin?.name">
                                {{ origin ? (origin.name || origin.lat.toFixed(4) + ', ' + origin.lng.toFixed(4)) : 'Click on map for Origin' }}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            <div class="w-2 h-2 rounded-full bg-red-500"></div>
                            <div class="text-xs truncate flex-1" :title="destination?.name">
                                {{ destination ? (destination.name || destination.lat.toFixed(4) + ', ' + destination.lng.toFixed(4)) : 'Click on map for Destination' }}
                            </div>
                        </div>
                        <Button v-if="origin || destination" label="Reset Search" icon="pi pi-refresh" severity="secondary" size="small" text @click="resetPoints" />
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-4">
                    <div v-if="loading" class="flex flex-col items-center justify-center py-8 gap-3">
                        <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
                        <span class="text-sm">Finding the best route...</span>
                    </div>

                    <div v-else-if="itineraries.length > 0">
                        <div class="text-xs font-bold text-gray-500 uppercase mb-3">Available Itineraries</div>
                        <div class="flex flex-col gap-3">
                            <div 
                                v-for="(iti, idx) in itineraries" 
                                :key="idx"
                                @click="selectItinerary(iti)"
                                class="p-3 rounded-lg border cursor-pointer transition-all"
                                :class="selectedItinerary === iti ? 'border-primary bg-primary/5 shadow-sm' : 'bg-white dark:bg-gray-800 hover:border-gray-300'"
                            >
                                <div class="text-sm font-semibold mb-2">{{ iti.description }}</div>
                                <div class="space-y-3 mt-4 border-l-2 border-dashed border-gray-200 ml-1 pl-4 relative">
                                    <div v-for="(seg, sidx) in iti.segments" :key="sidx" class="text-xs relative">
                                        <div 
                                            class="absolute -left-[21px] top-1 w-2 h-2 rounded-full border-2 border-white shadow-sm"
                                            :style="{ backgroundColor: seg.type === 'walk' ? '#94A3B8' : seg.route_color }"
                                        ></div>
                                        <div class="font-medium" :style="{ color: seg.type === 'ride' ? seg.route_color : '' }">
                                            {{ seg.instruction }}
                                        </div>
                                        <div v-if="seg.from_stop" class="text-gray-500 mt-1">
                                            From {{ seg.from_stop }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="origin && destination" class="text-center py-8 text-gray-500">
                        <i class="pi pi-map text-3xl mb-3"></i>
                        <p class="text-sm">No routes found for these locations yet.</p>
                    </div>

                    <div v-else class="text-center py-8 text-gray-400">
                        <i class="pi pi-map-marker text-3xl mb-3"></i>
                        <p class="text-sm italic">Click on the map to set your origin and destination points.</p>
                    </div>
                </div>
            </div>

            <!-- Map -->
            <div class="flex-1 relative">
                <div ref="mapContainer" class="h-full w-full"></div>
                <div v-if="!origin" class="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                    <div class="bg-white/90 backdrop-blur dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-lg border border-primary/20 text-sm font-medium">
                        📍 Select Origin on Map
                    </div>
                </div>
                <div v-else-if="!destination" class="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                    <div class="bg-white/90 backdrop-blur dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-lg border border-red-200 text-sm font-medium">
                        🎯 Select Destination on Map
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.leaflet-pane) {
    z-index: 1 !important;
}
:deep(.leaflet-top), :deep(.leaflet-bottom) {
    z-index: 2 !important;
}
:deep(.custom-div-icon) {
    background: transparent;
    border: none;
}
</style>
