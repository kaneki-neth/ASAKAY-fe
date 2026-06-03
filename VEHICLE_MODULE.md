Implement a complete Vehicle Management module.

Requirements:

Create pages:

1. Vehicle List Page

Features:
- Paginated table
- Search by name and code
- Filter by vehicle type
- Filter by status
- Sort by name
- Sort by date created
- Refresh button

Columns:
- Name
- Code
- Type
- Status
- Created By
- Actions

Actions:
- View
- Edit
- Delete

2. Vehicle Create Page

Fields:
- Name
- Code
- Type
- Description
- Status

Validation:
- Required fields
- Server-side validation handling

3. Vehicle Edit Page

Features:
- Load vehicle data
- Update vehicle
- Validation errors display

4. Vehicle View Page

Display:
- Vehicle details
- Metadata
- Created date
- Last updated date

5. Permission Handling

Permissions are returned from backend after login.

Example:

[
  "can_view_vehicle",
  "can_create_vehicle",
  "can_update_vehicle",
  "can_delete_vehicle"
]

Requirements:

- Hide Create button if no can_create_vehicle permission
- Hide Edit button if no can_update_vehicle permission
- Hide Delete button if no can_delete_vehicle permission
- Protect routes using Vue Router guards

6. API Layer

Create:

services/vehicleService.js

Methods:
- getVehicles
- getVehicle
- createVehicle
- updateVehicle
- deleteVehicle

7. Folder Structure

Organize using:

src/
├── pages/
│   └── vehicles/
├── components/
│   └── vehicles/
├── stores/
├── services/
├── router/

8. UI Requirements

- Responsive
- Reusable components
- Loading indicators
- Empty state
- Error state
- Delete confirmation modal

Generate complete Vue code including:
- Pages
- Components
- Axios Service
- Route Definitions
- Permission Guards