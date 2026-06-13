<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/service/api'
import { getVehicleTypeOptions } from '@/service/vehicles/vehicles'
import * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'

const L = (Leaflet as any).default || Leaflet

const toast = useToast()

const loading = ref(false)
const itineraries = ref<any[]>([])
const selectedItinerary = ref<any>(null)

const origin = ref<{ lat: number, lng: number, name?: string } | null>(null)
const destination = ref<{ lat: number, lng: number, name?: string } | null>(null)

const vehicleTypes = ref<any[]>([])
const selectedTypeIds = ref<number[]>([])

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

onMounted(async () => {
    initMap()
    try {
        vehicleTypes.value = await getVehicleTypeOptions()
    } catch (e) {
        console.error('Failed to load types', e)
    }
})

function initMap() {
    if (!mapContainer.value || mapInstance) return

    try {
        const defaultCenter: L.LatLngTuple = [14.5995, 120.9842]
        
        mapInstance = L.map(mapContainer.value, { zoomControl: false }).setView(defaultCenter, 13)
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance)

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    mapInstance?.setView([latitude, longitude], 15)
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
            className: 'custom-anchor-icon',
            html: '<div style="background-color: #1e3a8a; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
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
            className: 'custom-anchor-icon',
            html: '<div style="background-color: #ba1a1a; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
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

function swapPoints() {
    const temp = origin.value
    origin.value = destination.value
    destination.value = temp
    
    const tempMarker = originMarker
    originMarker = destMarker
    destMarker = tempMarker
    
    if (originMarker) originMarker.setIcon(L.divIcon({
        className: 'custom-anchor-icon',
        html: '<div style="background-color: #1e3a8a; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    }))
    
    if (destMarker) destMarker.setIcon(L.divIcon({
        className: 'custom-anchor-icon',
        html: '<div style="background-color: #ba1a1a; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    }))
    
    checkAndNavigate()
}

async function checkAndNavigate() {
    if (origin.value && destination.value) {
        loading.value = true
        try {
            const res = await api.post('/navigate', {
                origin_lat: origin.value.lat,
                origin_lng: origin.value.lng,
                dest_lat: destination.value.lat,
                dest_lng: destination.value.lng,
                vehicle_type_ids: selectedTypeIds.value.length > 0 ? selectedTypeIds.value : null
            })
            itineraries.value = res.data?.data ?? []
            if (itineraries.value.length > 0) {
                selectItinerary(itineraries.value[0])
            }
        } catch (e: any) {
            itineraries.value = []
            selectedItinerary.value = null
            routeLayers?.clearLayers()
        } finally {
            loading.value = false
        }
    }
}

function toggleType(id: number) {
    const idx = selectedTypeIds.value.indexOf(id)
    if (idx > -1) selectedTypeIds.value.splice(idx, 1)
    else selectedTypeIds.value.push(id)
    checkAndNavigate()
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
            L.polyline([[seg.start.lat, seg.start.lng], [seg.end.lat, seg.end.lng]], {
                color: '#94A3B8',
                dashArray: '5, 10',
                weight: 3
            }).addTo(routeLayers!)
            bounds.push([seg.start.lat, seg.start.lng], [seg.end.lat, seg.end.lng])
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

const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bus')) return 'directions_bus';
    if (n.includes('jeep')) return 'commute';
    if (n.includes('ferry') || n.includes('boat')) return 'directions_boat';
    return 'commute';
};
</script>

<template>
    <div class="h-[calc(100vh-9rem)] flex overflow-hidden font-geist rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <!-- Explorer Sidebar -->
        <aside class="w-80 border-r border-outline-variant flex flex-col bg-surface overflow-hidden">
            <div class="p-5 border-b border-outline-variant space-y-5">
                <div class="flex items-center gap-2 text-primary">
                    <span class="material-symbols-outlined text-2xl">explore</span>
                    <h2 class="font-bold text-lg text-on-surface">Route Explorer</h2>
                </div>

                <!-- Point Inputs -->
                <div class="space-y-4">
                    <div class="relative">
                        <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Origin</label>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-[18px]" style="font-variation-settings: 'FILL' 1;">trip_origin</span>
                            <input 
                                type="text" 
                                :value="origin?.name" 
                                readonly 
                                placeholder="Select on map..."
                                class="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors cursor-default"
                            >
                        </div>
                    </div>

                    <div class="flex justify-center -my-3.5 relative z-10">
                        <button @click="swapPoints" class="w-7 h-7 bg-surface border border-outline-variant rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors shadow-sm">
                            <span class="material-symbols-outlined text-[16px] text-outline">swap_vert</span>
                        </button>
                    </div>

                    <div class="relative">
                        <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Destination</label>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-error text-[18px]" style="font-variation-settings: 'FILL' 1;">location_on</span>
                            <input 
                                type="text" 
                                :value="destination?.name" 
                                readonly 
                                placeholder="Select on map..."
                                class="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors cursor-default"
                            >
                        </div>
                    </div>
                </div>

                <!-- Transport Filters -->
                <div class="space-y-2">
                    <h3 class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Transport Mode</h3>
                    <div class="flex flex-wrap gap-2">
                        <button 
                            v-for="type in vehicleTypes" 
                            :key="type.id"
                            @click="toggleType(type.id)"
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                            :class="selectedTypeIds.includes(type.id) ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-low'"
                        >
                            <span class="material-symbols-outlined text-[16px]">{{ getIcon(type.name) }}</span>
                            {{ type.name }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Results List -->
            <div class="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div v-if="loading" class="flex flex-col items-center justify-center h-full gap-3 py-10">
                    <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
                    <p class="text-xs text-on-surface-variant font-medium">Calculating best path...</p>
                </div>

                <div v-else-if="itineraries.length > 0" class="space-y-4">
                    <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Recommended Routes</p>
                    <div 
                        v-for="(iti, idx) in itineraries" 
                        :key="idx"
                        @click="selectItinerary(iti)"
                        class="p-4 rounded-xl border border-outline-variant cursor-pointer transition-all hover:shadow-md"
                        :class="selectedItinerary === iti ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'bg-surface-container-lowest hover:border-outline'"
                    >
                        <div class="flex justify-between items-start mb-3">
                            <span class="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold uppercase rounded">Fastest</span>
                            <div class="text-right">
                                <p class="text-lg font-bold text-primary leading-none">42 min</p>
                                <p class="text-[9px] text-on-surface-variant uppercase font-bold mt-1">Est. Time</p>
                            </div>
                        </div>
                        <h4 class="font-bold text-sm text-on-surface mb-1">Direct Connection</h4>
                        <p class="text-xs text-on-surface-variant leading-relaxed">{{ iti.description }}</p>
                        
                        <div v-if="selectedItinerary === iti" class="mt-4 space-y-4 pt-4 border-t border-outline-variant/30">
                            <div v-for="(seg, sidx) in iti.segments" :key="sidx" class="flex gap-3 relative">
                                <div v-if="sidx < iti.segments.length - 1" class="absolute left-2.5 top-6 bottom-[-16px] w-0.5 border-l-2 border-dashed border-outline-variant"></div>
                                <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm"
                                     :style="{ backgroundColor: seg.type === 'walk' ? '#f4f3fa' : seg.route_color, color: seg.type === 'walk' ? '#757682' : 'white' }">
                                    <span class="material-symbols-outlined text-[12px] font-bold">
                                        {{ seg.type === 'walk' ? 'directions_walk' : getIcon(seg.route_name || '') }}
                                    </span>
                                </div>
                                <div>
                                    <p class="text-xs font-bold text-on-surface">{{ seg.instruction }}</p>
                                    <p v-if="seg.from_stop" class="text-[10px] text-on-surface-variant mt-0.5">From {{ seg.from_stop }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else-if="origin && destination" class="flex flex-col items-center justify-center h-full text-center py-10 px-4">
                    <span class="material-symbols-outlined text-4xl text-outline mb-3">map_off</span>
                    <h4 class="font-bold text-on-surface text-sm">No routes found</h4>
                    <p class="text-xs text-on-surface-variant mt-2 leading-relaxed">Try adjusting your transport filters or selecting points near major road networks.</p>
                </div>

                <div v-else class="flex flex-col items-center justify-center h-full text-center py-10 px-4">
                    <div class="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
                        <span class="material-symbols-outlined text-3xl text-outline">location_searching</span>
                    </div>
                    <h4 class="font-bold text-on-surface text-sm">Start your journey</h4>
                    <p class="text-xs text-on-surface-variant mt-2 leading-relaxed">Click anywhere on the map to set your origin and destination points.</p>
                </div>
            </div>

            <div v-if="selectedItinerary" class="p-4 border-t border-outline-variant bg-surface-container-low">
                <button class="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">navigation</span>
                    Start Navigation
                </button>
            </div>
        </aside>

        <!-- Map Area -->
        <main class="flex-1 relative bg-surface-dim">
            <div ref="mapContainer" class="w-full h-full z-0"></div>
            
            <!-- Map Overlay UI -->
            <div v-if="!origin" class="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div class="bg-primary/95 text-white px-5 py-2.5 rounded-full shadow-lg border border-white/20 text-xs font-bold flex items-center gap-2 backdrop-blur-sm">
                    <span class="material-symbols-outlined text-[18px]">trip_origin</span>
                    SELECT ORIGIN ON MAP
                </div>
            </div>
            <div v-else-if="!destination" class="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div class="bg-error/95 text-white px-5 py-2.5 rounded-full shadow-lg border border-white/20 text-xs font-bold flex items-center gap-2 backdrop-blur-sm">
                    <span class="material-symbols-outlined text-[18px]">location_on</span>
                    SELECT DESTINATION ON MAP
                </div>
            </div>

            <!-- Map Controls -->
            <div class="absolute top-6 right-6 flex flex-col gap-2 z-10">
                <button @click="mapInstance?.zoomIn()" class="w-10 h-10 bg-white border border-outline-variant flex items-center justify-center rounded-lg hover:bg-surface-container shadow-sm text-on-surface transition-colors">
                    <span class="material-symbols-outlined">add</span>
                </button>
                <button @click="mapInstance?.zoomOut()" class="w-10 h-10 bg-white border border-outline-variant flex items-center justify-center rounded-lg hover:bg-surface-container shadow-sm text-on-surface transition-colors">
                    <span class="material-symbols-outlined">remove</span>
                </button>
                <button @click="resetPoints" class="w-10 h-10 bg-white border border-outline-variant flex items-center justify-center rounded-lg hover:bg-surface-container shadow-sm text-error mt-4 transition-colors">
                    <span class="material-symbols-outlined">refresh</span>
                </button>
            </div>
        </main>
    </div>
</template>

<style scoped>
.font-geist {
    font-family: 'Geist', sans-serif;
}
:deep(.leaflet-pane) {
    z-index: 1 !important;
}
:deep(.leaflet-top), :deep(.leaflet-bottom) {
    z-index: 2 !important;
}
:deep(.custom-anchor-icon) {
    background: transparent;
    border: none;
}
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--p-outline-variant);
    border-radius: 10px;
}
</style>

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
