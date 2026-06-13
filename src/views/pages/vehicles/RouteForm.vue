<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { createRoute, getRoute, updateRoute } from '@/service/vehicles/routes'
import { getVehicleTypeOptions } from '@/service/vehicles/vehicles'
import { listStops } from '@/service/vehicles/stops'
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
    color: '#006a69',
    status: 'active',
    polyline: [] as { lat: number, lng: number }[],
    stops: [] as any[]
})

const userClicks = ref<{ lat: number, lng: number }[]>([])
const errors = ref<Record<string, string>>({})

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
            listStops()
        ])
        vehicleTypes.value = types
        availableStops.value = stops

        if (id.value) {
            const data = await getRoute(id.value)
            form.value = {
                name: data.name,
                code: data.code,
                vehicle_type_id: data.vehicle_type_id,
                color: data.color || '#006a69',
                status: data.status,
                polyline: data.polyline || [],
                stops: data.stops || []
            }
            userClicks.value = data.polyline || []
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data' })
    } finally {
        loading.value = false
        nextTick(() => initMap())
    }
}

onMounted(async () => {
    await fetchProfile()
    loadData()
})

onBeforeUnmount(() => {
    if (mapInstance) mapInstance.remove()
})

function initMap() {
    if (!mapContainer.value || mapInstance) return

    const defaultCenter: any = [14.5995, 120.9842]
    const initialCenter: any = form.value.polyline.length > 0 
        ? [form.value.polyline[0].lat, form.value.polyline[0].lng]
        : defaultCenter

    mapInstance = L.map(mapContainer.value, { zoomControl: false }).setView(initialCenter, 13)
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)

    polylineLayer = L.polyline([], { color: form.value.color, weight: 5, opacity: 0.8 }).addTo(mapInstance)

    mapInstance.on('click', async (e: any) => {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng }
        userClicks.value.push(newPoint)
        await recalculatePath()
    })

    updateMapElements()
}

async function recalculatePath() {
    if (userClicks.value.length < 2) {
        form.value.polyline = [...userClicks.value]
    } else if (!snapToRoad.value) {
        form.value.polyline = [...userClicks.value]
    } else {
        try {
            const coords = userClicks.value.map(p => `${p.lng},${p.lat}`).join(';')
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
            const data = await res.json()
            if (data.routes?.length > 0) {
                form.value.polyline = data.routes[0].geometry.coordinates.map((c: any) => ({ lat: c[1], lng: c[0] }))
            } else {
                form.value.polyline = [...userClicks.value]
            }
        } catch (e) {
            form.value.polyline = [...userClicks.value]
        }
    }
    updateMapElements()
    detectSuggestedStops()
}

function updateMapElements() {
    if (!mapInstance || !polylineLayer) return

    const color = form.value.color || '#006a69'
    const path = form.value.polyline.map(p => [p.lat, p.lng])
    polylineLayer.setLatLngs(path).setStyle({ color })

    pointMarkers.forEach(m => m.remove())
    pointMarkers = []
    userClicks.value.forEach((p, index) => {
        const m = L.marker([p.lat, p.lng], { 
            draggable: true,
            icon: L.divIcon({
                className: 'custom-anchor',
                html: `<div style="background-color: white; width: 12px; height: 12px; border-radius: 50%; border: 2px solid ${color}; box-shadow: 0 0 5px rgba(0,0,0,0.2);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(mapInstance)
        m.on('dragend', async (ev: any) => {
            userClicks.value[index] = { lat: ev.target.getLatLng().lat, lng: ev.target.getLatLng().lng }
            await recalculatePath()
        })
        pointMarkers.push(m)
    })

    stopMarkers.forEach(m => m.remove())
    stopMarkers = []
    form.value.stops.forEach((stop, idx) => {
        const sm = L.marker([stop.latitude, stop.longitude], {
            icon: L.divIcon({
                className: 'custom-stop',
                html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 0 8px rgba(0,0,0,0.2);">${idx + 1}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(mapInstance)
        sm.bindTooltip(stop.name)
        stopMarkers.push(sm)
    })
}

function detectSuggestedStops() {
    if (form.value.polyline.length === 0) {
        suggestedStops.value = []
        return
    }
    const currentIds = form.value.stops.map(s => s.id)
    suggestedStops.value = availableStops.value.filter(s => {
        if (currentIds.includes(s.id)) return false
        return form.value.polyline.some(p => {
            const d = L.latLng(p.lat, p.lng).distanceTo(L.latLng(s.latitude, s.longitude))
            return d < 150
        })
    })
}

function addStop(stop: any) {
    if (!form.value.stops.find(s => s.id === stop.id)) {
        form.value.stops.push(stop)
        updateMapElements()
        detectSuggestedStops()
    }
}

async function save() {
    errors.value = {}
    if (!form.value.name?.trim()) errors.value.name = 'Name is required'
    if (!form.value.code?.trim()) errors.value.code = 'Code is required'
    if (!form.value.vehicle_type_id) errors.value.vehicle_type_id = 'Type is required'
    if (Object.keys(errors.value).length > 0) return

    saving.value = true
    try {
        const payload = { ...form.value, stops: form.value.stops.map(s => s.id) }
        if (id.value) await updateRoute(id.value, payload)
        else await createRoute(payload)
        toast.add({ severity: 'success', summary: 'Success', detail: 'Route saved' })
        router.push('/transport/routes')
    } catch (e) {
        // Errors handled by interceptor
    } finally {
        saving.value = false
    }
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
    <div class="h-[calc(100vh-9rem)] flex overflow-hidden font-geist rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <!-- Technical Sidebar -->
        <aside class="w-96 border-r border-outline-variant flex flex-col bg-surface overflow-hidden">
            <div class="p-5 border-b border-outline-variant space-y-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-primary">
                        <span class="material-symbols-outlined text-2xl">architecture</span>
                        <h2 class="font-bold text-lg text-on-surface">{{ isCreate ? 'New Route' : 'Edit Route' }}</h2>
                    </div>
                    <Tag :value="form.status" :severity="form.status === 'active' ? 'success' : 'secondary'" class="uppercase text-[10px]" />
                </div>

                <div class="space-y-4">
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-4 space-y-1">
                            <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Code</label>
                            <InputText v-model="form.code" class="w-full !py-1.5 font-mono text-xs" placeholder="R01" :class="{'p-invalid': errors.code}" />
                        </div>
                        <div class="col-span-8 space-y-1">
                            <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Mode</label>
                            <Select v-model="form.vehicle_type_id" :options="vehicleTypes" optionLabel="name" optionValue="id" placeholder="Select Type" class="w-full !py-0 text-xs" />
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Route Name</label>
                        <InputText v-model="form.name" class="w-full !py-1.5 text-sm font-bold" placeholder="e.g. Downtown Express" :class="{'p-invalid': errors.name}" />
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="flex-1 space-y-1">
                            <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Route Color</label>
                            <div class="flex items-center gap-2">
                                <ColorPicker v-model="form.color" @change="updateMapElements" />
                                <span class="font-mono text-xs text-on-surface-variant">#{{ form.color.replace('#','') }}</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Status</label>
                            <Select v-model="form.status" :options="[{label:'Active', value:'active'},{label:'Inactive', value:'inactive'}]" optionLabel="label" optionValue="value" class="!py-0 text-xs" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sequence List -->
            <div class="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <h3 class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Stop Sequence</h3>
                        <span class="text-[10px] font-mono text-outline">{{ form.stops.length }} Units</span>
                    </div>

                    <div v-if="form.stops.length === 0" class="border border-dashed border-outline-variant rounded-xl p-8 text-center bg-surface-container-low">
                        <span class="material-symbols-outlined text-outline text-3xl mb-2">add_location_alt</span>
                        <p class="text-xs text-on-surface-variant">No stops in sequence.<br/>Use suggestions or picker.</p>
                    </div>

                    <div class="space-y-2">
                        <div v-for="(stop, idx) in form.stops" :key="stop.id" class="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant rounded-lg group hover:border-primary/40 transition-all">
                            <div class="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">{{ idx + 1 }}</div>
                            <div class="flex-1 min-w-0">
                                <p class="text-xs font-bold text-on-surface truncate">{{ stop.name }}</p>
                                <p class="text-[9px] text-on-surface-variant truncate opacity-60">{{ stop.address }}</p>
                            </div>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button @click="form.stops.splice(idx, 1); updateMapElements(); detectSuggestedStops()" class="p-1 hover:text-error transition-colors">
                                    <span class="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Suggestions -->
                <div v-if="suggestedStops.length > 0" class="space-y-3 pt-4 border-t border-outline-variant/30">
                    <div class="flex items-center gap-1.5 text-secondary">
                        <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
                        <h3 class="text-[10px] font-bold uppercase tracking-wider">Proximity Suggestions</h3>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button 
                            v-for="s in suggestedStops" :key="s.id"
                            @click="addStop(s)"
                            class="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface hover:border-secondary hover:text-secondary transition-all text-[10px] font-bold flex items-center gap-1.5"
                        >
                            <span class="material-symbols-outlined text-[14px]">add</span>
                            {{ s.name }}
                        </button>
                    </div>
                </div>

                <div class="pt-2">
                    <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Add Existing Stop</label>
                    <Select :options="availableStops" filter optionLabel="name" placeholder="Search physical stops..." class="w-full !py-0 text-xs" @change="(e:any) => addStop(e.value)" />
                </div>
            </div>

            <div class="p-5 border-t border-outline-variant bg-surface-container-low flex gap-3">
                <button @click="router.push('/transport/routes')" class="flex-1 px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface hover:bg-surface transition-colors">Discard</button>
                <button @click="save" :disabled="saving" class="flex-[2] bg-primary text-white py-2 rounded-lg font-bold text-xs hover:bg-primary-container transition-all shadow-sm flex items-center justify-center gap-2">
                    <i v-if="saving" class="pi pi-spin pi-spinner text-[12px]"></i>
                    {{ isCreate ? 'Commit Route' : 'Update Route' }}
                </button>
            </div>
        </aside>

        <!-- Precision Path Map Area -->
        <main class="flex-1 relative bg-surface-dim">
            <div ref="mapContainer" class="w-full h-full z-0"></div>
            
            <!-- Technical HUD Overlay -->
            <div class="absolute top-6 left-6 z-10 space-y-4">
                <div class="bg-white/95 backdrop-blur-sm border border-outline-variant p-4 rounded-xl shadow-lg max-w-xs pointer-events-auto">
                    <div class="flex items-center gap-2 text-primary mb-1">
                        <span class="material-symbols-outlined text-[18px]">polyline</span>
                        <h4 class="text-xs font-bold uppercase tracking-wide">Path Architect</h4>
                    </div>
                    <p class="text-[10px] text-on-surface-variant leading-relaxed">Click on the map to define route anchors. The system will auto-align to road networks.</p>
                    
                    <div class="mt-4 flex items-center justify-between pt-3 border-t border-outline-variant/30">
                        <div class="flex items-center gap-2">
                            <ToggleSwitch v-model="snapToRoad" @change="recalculatePath" />
                            <span class="text-[10px] font-bold text-on-surface uppercase">Road-Snap</span>
                        </div>
                        <div class="flex gap-2">
                            <button @click="userClicks.pop(); recalculatePath()" :disabled="userClicks.length === 0" class="w-8 h-8 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-container text-on-surface disabled:opacity-30">
                                <span class="material-symbols-outlined text-[18px]">undo</span>
                            </button>
                            <button @click="userClicks = []; recalculatePath()" :disabled="userClicks.length === 0" class="w-8 h-8 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-container text-error disabled:opacity-30">
                                <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="userClicks.length > 0" class="bg-primary/95 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm animate-fadein">
                    <span class="material-symbols-outlined text-[14px]">insights</span>
                    {{ form.polyline.length }} GEO-POINTS GENERATED
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
:deep(.custom-anchor) {
    background: transparent;
    border: none;
}
:deep(.custom-stop) {
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
