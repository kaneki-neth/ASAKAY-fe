# Architecture

## Directory Structure
- `src/`: Root of the source code.
  - `assets/`: Static assets like styles, images, and fonts.
  - `components/`: Reusable Vue components.
    - `dashboard/`: Components specific to the dashboard.
    - `landing/`: Components for the landing page.
  - `layout/`: Layout components (topbar, sidebar, footer, etc.).
  - `router/`: Vue Router configuration and routes.
  - `service/`: API services and other utility services.
    - `auth/`: Authentication related services.
    - `permissions/`: Permission management services.
    - `roles/`: Role management services.
    - `users/`: User management services.
  - `views/`: Page components.
    - `pages/`: General pages (auth, roles, users, etc.).
    - `uikit/`: UI kit documentation/examples.
    - `utilities/`: Utility pages.

## Key Design Patterns
- **Composition API:** Used for component logic.
- **Service Layer:** Encapsulates API calls and business logic.
- **Composable Layout:** Flexible layout system managed via composables.
- **Component-Based UI:** Reusable components for data tables, managers, and widgets.

## Data Flow
- Components interact with services to fetch and manipulate data.
- Services use Axios for HTTP requests to the backend.
- Router manages navigation and page-level state.
