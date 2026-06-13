<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getDashboardSummary, getRecentRouteActivity } from '@/service/admin/dashboard';
import * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';

const L = (Leaflet as any).default || Leaflet;

const router = useRouter();

// Dashboard Data
const summary = ref({
    totalRoutes: 0,
    totalStops: 0,
    totalVehicles: 0,
    totalContributors: 0
});
const recentActivity = ref<any[]>([]);
const loading = ref(true);

// Map related
const mapContainer = ref<HTMLElement | null>(null);
let mapInstance: any = null;

onMounted(async () => {
    loading.value = true;
    try {
        const [summaryData, activityData] = await Promise.all([
            getDashboardSummary(),
            getRecentRouteActivity(5)
        ]);
        
        summary.value = summaryData;
        recentActivity.value = activityData;
        
        nextTick(() => {
            initMap();
        });
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
    } finally {
        loading.value = false;
    }
});

onBeforeUnmount(() => {
    if (mapInstance) {
        mapInstance.remove();
    }
});

function initMap() {
    if (!mapContainer.value || mapInstance) return;

    try {
        // Manila Center
        const center = [14.5995, 120.9842];
        
        mapInstance = L.map(mapContainer.value, {
            zoomControl: false,
            attributionControl: false
        }).setView(center, 12);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(mapInstance);

        // Add some mock route coverage lines
        const mockPaths = [
            [[14.6095, 120.9842], [14.5547, 121.0244]],
            [[14.6300, 121.0300], [14.5900, 120.9700]],
            [[14.5500, 120.9800], [14.6200, 121.0500]]
        ];

        mockPaths.forEach(path => {
            L.polyline(path, {
                color: '#006a69',
                weight: 4,
                opacity: 0.6
            }).addTo(mapInstance);
        });

    } catch (error) {
        console.error('Failed to initialize map:', error);
    }
}

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
};

const getStatusSeverity = (status) => {
    if (!status) return 'info';
    const s = status.toLowerCase();
    if (s === 'active') return 'success';
    if (s === 'draft') return 'secondary';
    if (s === 'inactive') return 'danger';
    return 'info';
};

function goNewRoute() {
    router.push('/transport/routes/new');
}
</script>

<template>
    <div class="space-y-6 font-geist">
        <!-- Page Header -->
        <header class="flex justify-between items-end mb-6">
            <div>
                <h1 class="text-3xl font-bold text-on-surface">Dashboard Overview</h1>
                <p class="text-sm text-on-surface-variant mt-1">{{ new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
            </div>
            <div class="flex gap-3">
                <button class="bg-surface-container-lowest border border-outline-variant hover:bg-surface-container px-4 py-2 rounded-lg text-sm font-medium text-on-surface transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">download</span>
                    Export Report
                </button>
                <button @click="goNewRoute" class="bg-primary hover:bg-primary-container px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors">
                    Add New Route
                </button>
            </div>
        </header>

        <!-- Top Row: Stats Cards -->
        <section class="grid grid-cols-12 gap-6">
            <!-- Total Routes -->
            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xs text-on-surface-variant uppercase tracking-wider font-medium">Total Routes</h3>
                    <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">directions_bus</span>
                </div>
                <div class="text-4xl font-bold text-primary mb-1">{{ summary.totalRoutes }}</div>
                <div class="flex items-center gap-1 text-xs text-secondary">
                    <span class="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>Active coverage</span>
                </div>
                <!-- Sparkline Placeholder -->
                <svg class="absolute bottom-0 left-0 w-full h-12 opacity-20 text-secondary" preserveAspectRatio="none" viewBox="0 0 100 30">
                    <path d="M0,30 L0,20 L10,25 L20,15 L30,22 L40,10 L50,18 L60,5 L70,12 L80,2 L90,8 L100,0 L100,30 Z" fill="currentColor"></path>
                </svg>
            </div>

            <!-- Total Stops -->
            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xs text-on-surface-variant uppercase tracking-wider font-medium">Total Stops</h3>
                    <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">location_on</span>
                </div>
                <div class="text-4xl font-bold text-primary mb-1">{{ summary.totalStops }}</div>
                <div class="flex items-center gap-1 text-xs text-secondary">
                    <span class="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>Mapped locations</span>
                </div>
                <svg class="absolute bottom-0 left-0 w-full h-12 opacity-20 text-secondary" preserveAspectRatio="none" viewBox="0 0 100 30">
                    <path d="M0,30 L0,25 L10,20 L20,28 L30,15 L40,20 L50,10 L60,15 L70,5 L80,10 L90,2 L100,0 L100,30 Z" fill="currentColor"></path>
                </svg>
            </div>

            <!-- Total Transports -->
            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xs text-on-surface-variant uppercase tracking-wider font-medium">Total Transports</h3>
                    <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">commute</span>
                </div>
                <div class="text-4xl font-bold text-primary mb-1">{{ summary.totalVehicles }}</div>
                <div class="flex items-center gap-1 text-xs text-on-surface-variant">
                    <span class="material-symbols-outlined text-outline text-[16px]">trending_flat</span>
                    <span>Stable units</span>
                </div>
                <svg class="absolute bottom-0 left-0 w-full h-12 opacity-10 text-primary" preserveAspectRatio="none" viewBox="0 0 100 30">
                    <path d="M0,30 L0,15 L20,16 L40,14 L60,15 L80,14 L100,15 L100,30 Z" fill="currentColor"></path>
                </svg>
            </div>

            <!-- Total Contributors -->
            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xs text-on-surface-variant uppercase tracking-wider font-medium">Total Contributors</h3>
                    <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">volunteer_activism</span>
                </div>
                <div class="text-4xl font-bold text-primary mb-1">{{ summary.totalContributors }}</div>
                <div class="flex items-center gap-1 text-xs text-secondary">
                    <span class="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>Platform growth</span>
                </div>
                <svg class="absolute bottom-0 left-0 w-full h-12 opacity-20 text-secondary" preserveAspectRatio="none" viewBox="0 0 100 30">
                    <path d="M0,30 L0,28 L10,29 L20,25 L30,22 L40,24 L50,18 L60,15 L70,8 L80,10 L90,4 L100,0 L100,30 Z" fill="currentColor"></path>
                </svg>
            </div>
        </section>

        <!-- Middle Row: Table & Chart -->
        <section class="grid grid-cols-12 gap-6">
            <!-- Recent Route Activity -->
            <div class="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
                <div class="px-4 py-4 border-b border-outline-variant flex justify-between items-center bg-surface">
                    <h2 class="text-lg font-semibold text-on-surface">Recent Route Activity</h2>
                    <button @click="router.push('/transport/routes')" class="text-sm font-medium text-primary hover:text-primary-container transition-colors">View All</button>
                </div>
                <div class="overflow-x-auto flex-1">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-surface text-xs text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">
                                <th class="px-4 py-3 font-medium">Route Name</th>
                                <th class="px-4 py-3 font-medium">Transport</th>
                                <th class="px-4 py-3 font-medium">Contributor</th>
                                <th class="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm text-on-surface divide-y divide-outline-variant/50">
                            <tr v-for="route in recentActivity" :key="route.id" class="hover:bg-surface-container-low transition-colors group">
                                <td @click="router.push(`/transport/routes/${route.id}/edit`)" class="px-4 py-3 font-medium text-primary group-hover:underline cursor-pointer">{{ route.name }}</td>
                                <td class="px-4 py-3">{{ route.transport }}</td>
                                <td class="px-4 py-3 text-on-surface-variant">{{ route.contributor }}</td>
                                <td class="px-4 py-3">
                                    <Tag :value="route.status || 'Active'" :severity="getStatusSeverity(route.status)" />
                                </td>
                            </tr>
                            <tr v-if="recentActivity.length === 0">
                                <td colspan="4" class="px-4 py-8 text-center text-on-surface-variant italic">No recent activity found.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Route Activity Chart -->
            <div class="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col p-4">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-semibold text-on-surface">Activity (Last 7 Days)</h2>
                    <span class="material-symbols-outlined text-outline">more_horiz</span>
                </div>
                <!-- CSS Bar Chart -->
                <div class="flex-1 flex items-end justify-between gap-2 h-48 mt-auto border-b border-outline-variant pb-2">
                    <div class="flex flex-col items-center gap-2 w-full group cursor-pointer" v-for="(day, i) in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="day">
                        <div class="w-full bg-primary-fixed-dim rounded-t-sm group-hover:bg-primary transition-colors relative" :style="{ height: [30, 45, 20, 60, 80, 40, 55][i] + '%' }">
                            <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {{ [12, 18, 8, 24, 32, 16, 22][i] }}
                            </div>
                        </div>
                        <span class="text-[10px] text-on-surface-variant" :class="{'text-primary font-bold': day === 'Sun'}">{{ day }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Bottom Row: Map Coverage -->
        <section class="col-span-12">
            <div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col relative h-[480px]">
                <!-- Map Header Overlay -->
                <div class="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
                    <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-outline-variant p-4 rounded-lg pointer-events-auto max-w-sm shadow-sm">
                        <h2 class="text-lg font-semibold text-on-surface mb-1">System-wide Route Coverage</h2>
                        <p class="text-xs text-on-surface-variant mb-4">Real-time density map of active transport routes across the metropolitan area.</p>
                        <div class="flex items-center gap-3">
                            <span class="w-3 h-3 rounded-full bg-[#006a69]"></span>
                            <span class="text-xs text-on-surface">Active Routes</span>
                        </div>
                    </div>
                    <!-- Map Controls -->
                    <div class="flex flex-col gap-2 pointer-events-auto shadow-sm">
                        <button @click="mapInstance?.zoomIn()" class="w-10 h-10 bg-white dark:bg-gray-800 border border-outline-variant flex items-center justify-center rounded hover:bg-surface-container text-on-surface transition-colors">
                            <span class="material-symbols-outlined">add</span>
                        </button>
                        <button @click="mapInstance?.zoomOut()" class="w-10 h-10 bg-white dark:bg-gray-800 border border-outline-variant flex items-center justify-center rounded hover:bg-surface-container text-on-surface transition-colors">
                            <span class="material-symbols-outlined">remove</span>
                        </button>
                    </div>
                </div>
                <!-- Map Container -->
                <div ref="mapContainer" class="w-full h-full bg-inverse-surface"></div>
            </div>
        </section>
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
</style>
