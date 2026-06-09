Implement Routes & Route Drawing Map Module (Public Transportation Navigator)

You are a senior full-stack engineer working on an existing web application. Your task is to implement a Routes and Route Drawing Map Module for a public transportation navigation system.

🧭 Project Context

The application helps users discover how to travel to unfamiliar places using fixed-route public transportation, such as:

Jeepneys
Buses
Vans

It functions as a route-mapping platform that shows how to reach destinations by combining real-world transport routes.

The system already has an existing UI layout and architecture (header, sidebar, footer, authentication, and base routing system). You must integrate this module into the existing codebase without breaking existing features.

🎯 Core Objective

Build a module that allows users to:

Search a destination or select a point on the map
View available public transport routes
Visualize step-by-step travel paths
See route overlays drawn on an interactive map
Understand transfers between routes (if multiple rides are needed)
🗺️ Feature Requirements
1. Route Map Interface
Use an interactive map (Leaflet / Google Maps / Mapbox depending on existing stack)
Allow users to:
Search destination (autocomplete if possible)
Click origin and destination on map
Display markers for:
Origin
Destination
Transfer points / stops
2. Route Drawing System
Render polylines showing:
Jeepney routes
Bus routes
Van routes
Differentiate transport types using:
Colors
Line styles (solid, dashed, etc.)
Show route direction flow (optional arrows)
3. Route Computation Logic

Implement or integrate logic that:

Finds possible routes from origin to destination
Supports:
Single-route travel
Multi-route travel (with transfers)
Prioritizes:
Least transfers
Shortest distance OR estimated travel time
4. Route Details Panel

A side panel or modal should show:

Step-by-step instructions:
“Ride Jeepney A from Point X to Stop Y”
“Transfer to Bus B”
Estimated travel time (can be mocked if no API exists)
Fare estimation (optional placeholder if no data source)
List of stops per route segment
5. Data Structure Design

Design a scalable structure for routes such as:

Routes (e.g., Jeepney Route 01)
route_id
name
type (jeepney/bus/van)
polyline_coordinates
stops[]
Stops
stop_id
name
lat/lng
Connections
which stops allow transfers between routes

Ensure the system supports future expansion to real-time or GTFS-like data.

6. UI/UX Requirements
Clean, modern interface integrated into existing admin/dashboard layout
Responsive (mobile-friendly map view)
Loading states for route computation
Empty states (no route found)
Highlight active route clearly
7. Technical Constraints
Must integrate into existing project structure
Do NOT redesign layout (reuse current sidebar/header)
Keep code modular (separate services for:
map rendering
route computation
UI components
)
Optimize for performance when rendering multiple routes
8. Optional Enhancements (if time allows)
Drag-and-drop origin/destination selection
Save favorite routes
Recent searches
Simulated live vehicle movement along routes
Export/share route link
🧪 Output Expected

Provide:

Implemented module code
Required components and services
Route computation logic
Map integration setup
Brief explanation of how the system works
⚠️ Important
Do not hardcode UI outside module scope
Ensure scalability for future real-world transport data integration
Keep architecture clean and maintainable
Assume this will later connect to a real GIS / transport dataset