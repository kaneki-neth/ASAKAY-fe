# ASAKAY UI Enhancement Implementation Plan - COMPLETED

This plan outlines the steps to update the existing vehicle and route management pages to match the design templates provided in `stitch_route_management`.

## Core Principles
- Reuse existing PrimeVue components (`AppDataTable`, `Select`, `Tag`, etc.).
- Follow the "engineering-like" aesthetic (clean lines, Material Symbols, specific color palette).
- Maintain existing functionality while adding new UI elements.
- Ensure responsiveness.

## Phase 1: Dashboard Overhaul (`src/views/Dashboard.vue`)
- [x] **Metrics Cards:** Implement the 4 stats cards (Total Routes, Total Stops, Total Transports, Total Contributors) with sparkline placeholders.
- [x] **Recent Activity Table:** Update to show route-specific activity (Route Name, Transport, Contributor, Status).
- [x] **Activity Chart:** Implement the 7-day bar chart using Chart.js.
- [x] **Coverage Map:** Integrate a Leaflet map with a "density" look as shown in the template.

## Phase 2: Transport Management (`src/views/pages/vehicles/Vehicles.vue`)
- [x] **Status Indicators:** Implement the "Online", "Maintenance", and "Offline" statuses with dot indicators.
- [x] **Table Layout:** Refine columns to match "Name", "Type", "Active Routes", "Status", and "Actions".
- [x] **Create/Edit Drawer:** Adapt the existing form to a side-panel (Drawer/Sidebar).

## Phase 3: Transport Types (`src/views/pages/vehicles/VehicleTypes.vue`)
- [x] **Metrics Grid:** Implement the summary cards for Jeepney, Bus, Van, etc.
- [x] **Summary Table:** Update the table to match the template's summary overview.

## Phase 4: Route Explorer (`src/views/pages/vehicles/Navigator.vue`)
- [x] **Search Panel:** Update the left panel to include Origin/Destination inputs with the "Swap" button.
- [x] **Transport Filters:** Add the transport type toggle buttons (Jeepney, Bus, Ferry, Taxi).
- [x] **Results Card:** Implement the detailed itinerary card with segment breakdown.

## Phase 5: Route & Stops Management (`src/views/pages/vehicles/Routes.vue` & `Stops.vue`)
- [x] **Table Refinement:** Update tables to match the consistent "engineering" look.
- [x] **Map Integration:** Ensure map-based lists match the desaturated technical look.

## Phase 6: Route Creation Form (`src/views/pages/vehicles/RouteForm.vue`)
- [x] **Form Layout:** Refine the split-screen layout (sidebar for sequence, main area for map).
- [x] **Drawing Experience:** Enhance the "Snap to Road" and "Undo" controls.

## Technical Details
- **Icons:** Use `Material Symbols Outlined`.
- **Colors:** Use the project's Tailwind/PrimeVue theme colors.
- **Typography:** Use `Geist` font.

## Verification
- [x] Check responsiveness on mobile and tablet.
- [x] Verify all API integrations still work.
- [x] Ensure consistent look and feel across all updated pages.
