# User Sessions Module

This module manages user session tracking for the application. It tracks when authenticated users log in, their activity, and provides heartbeat functionality to maintain active sessions.

## Features

- Creates a new session when a user logs in
- Tracks session activity with heartbeats
- Automatically creates a new session if inactive for 1 hour
- Provides API endpoints for managing sessions
- Includes detailed logging for session activities
- Automatically renews expired sessions when possible
- Tracks content engagement status for analytics

## How it Works

1. **Session Creation**: When a user logs in, a session is created with a unique session ID
2. **Frontend Storage**: The session ID is returned to the frontend, which should store it in local storage
3. **Heartbeat**: The frontend should send a heartbeat request every 5 minutes to update the "last active time"
4. **Session Expiry**: If the gap between heartbeats exceeds 1 hour, the server marks the current session as inactive
5. **Automatic Renewal**: When an expired session is detected, a new session is automatically created
6. **Content Engagement**: The frontend can mark a session as "engaged with content" when users interact meaningfully with content

## Authentication Requirements

All endpoints in this module require authentication. Sessions are only created and managed for authenticated users.

## API Endpoints

### `POST /user-sessions/heartbeat/:sessionId`

Updates the last active time for a session. If the session is expired (no activity for 1 hour), the system will:

- Create a new session automatically if user information is available
- Return a status indicating a new session is needed if user information is not available

**Response:**

```json
{
  "status": "active|expired|renewed",
  "needsNewSession": boolean,
  "sessionId": "string (only when renewed)"
}
```

### `GET /user-sessions`

Returns all active sessions for the authenticated user.

### `POST /user-sessions/end/:sessionId`

Explicitly ends a session.

### `PATCH /user-sessions/:sessionId/content-engaged`

Updates the content engagement status for a session.

**Request Body:**

```json
{
  "engaged": boolean
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Content engaged status updated to true|false",
  "sessionId": "string",
  "contentEngaged": boolean
}
```

## Session Metrics

Session metrics are available in the Metrics module. See the Metrics module documentation for details.

### Metrics Endpoints

- `GET /metrics/sessions`: Get aggregated session metrics between date ranges
- `GET /metrics/sessions/daily`: Get daily session counts and engagement between date ranges

## Frontend Implementation

The frontend should:

1. Store the session ID in local storage after login
2. Set up a timer to send heartbeat requests every 5 minutes
3. If a heartbeat response indicates `needsNewSession: true`, redirect to login
4. If a heartbeat response includes a new `sessionId`, update the stored session ID
5. Send the session ID during logout to properly end the session
6. Update the content engagement status when users interact with content

## Example Frontend Code

```javascript
// After login
const handleLogin = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.body.sessionId) {
    localStorage.setItem('sessionId', response.data.body.sessionId);
    startHeartbeat();
  }
};

// Heartbeat function
const startHeartbeat = () => {
  const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const sendHeartbeat = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;

    try {
      const response = await api.post(`/user-sessions/heartbeat/${sessionId}`);

      if (response.data.status === 'renewed' && response.data.sessionId) {
        // Update to the new session ID
        localStorage.setItem('sessionId', response.data.sessionId);
      } else if (response.data.needsNewSession) {
        // Session expired, redirect to login
        localStorage.removeItem('sessionId');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Heartbeat failed', error);
    }
  };

  // Send initial heartbeat
  sendHeartbeat();

  // Set up interval
  const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  // Store interval ID to clear it later if needed
  localStorage.setItem('heartbeatIntervalId', intervalId);
};

// Logout function
const handleLogout = async () => {
  const sessionId = localStorage.getItem('sessionId');
  await api.post('/auth/logout', { sessionId });
  localStorage.removeItem('sessionId');
  clearInterval(parseInt(localStorage.getItem('heartbeatIntervalId')));
  localStorage.removeItem('heartbeatIntervalId');
};

// Update content engagement status
const setContentEngaged = async (engaged = true) => {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) return;

  try {
    await api.patch(`/user-sessions/${sessionId}/content-engaged`, { engaged });
  } catch (error) {
    console.error('Failed to update content engagement status', error);
  }
};

// Call when user starts engaging with content (e.g., watches a video, reads an article)
const trackContentEngagement = () => {
  setContentEngaged(true);
};

// Get session metrics - from the Metrics module
const getSessionMetrics = async (startDate, endDate) => {
  try {
    const url = `/metrics/sessions?startDate=${startDate}&endDate=${endDate}`;

    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch session metrics', error);
    return null;
  }
};

// Get daily session metrics - from the Metrics module
const getDailySessionMetrics = async (startDate, endDate) => {
  try {
    const url = `/metrics/sessions/daily?startDate=${startDate}&endDate=${endDate}`;

    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch daily session metrics', error);
    return null;
  }
};
```
