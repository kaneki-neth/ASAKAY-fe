# API Client Pattern

## Overview
The project uses Axios for all HTTP requests to the backend. A centralized API client is configured to handle authentication and error management.

## Configuration
- **Base URL:** Configured using the environment variable `VITE_API_BASE_URL`.
- **Interceptors:**
  - **Request:** Automatically attaches the JWT token from `localStorage` to the `Authorization` header if it exists.
  - **Response:** Handles errors globally, extracting messages from the response and emitting toast notifications. It also handles 401 Unauthorized by clearing the token and triggering a logout event.

## Usage
Import the `api` instance from `@/service/api` and use it for all requests.

```typescript
import api from '@/service/api';

const fetchData = async () => {
  const response = await api.get('/endpoint');
  return response.data;
};
```

## Error Handling
The client extracts error messages from the following fields in the response data:
1. `message`
2. `error`
3. `detail`
4. `errors` (for 422 Validation Errors, it flattens and joins the list)
