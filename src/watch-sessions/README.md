# Watch Sessions Module

This module provides functionality for managing video watch sessions in the application. It allows tracking user engagement with videos by recording session data such as view duration, progress, and user interaction events.

## Entities

The module uses the `WatchSession` entity which includes:

- User session information (linked to UserSession entity)
- Video being watched (linked to Video entity)
- Session timing data (start/end times, actual time watched)
- Progress tracking (percentage watched)
- User events (play, pause, seek events with timestamps)
- User metadata (device info, browser, OS, etc.)

## Features

The module provides the following features:

1. **Create Watch Sessions**: Record new video watch sessions
2. **Update Watch Sessions**: Update existing watch session records
3. **Get All Watch Sessions**: Retrieve all watch sessions
4. **Get Watch Session by ID**: Get a specific watch session
5. **Get Watch Sessions by User Session**: Find all watch sessions for a particular user session
6. **Get Watch Sessions by User ID**: Find all watch sessions for a specific user
7. **Delete Watch Session**: Remove a watch session record

## Usage

### Creating a Watch Session

```typescript
POST /watch-sessions

Body:
{
  "userSessionId": "user-session-uuid", // Optional, for logged-in users
  "isGuestWatchSession": false, // Optional, default is false
  "videoId": "video-uuid",
  "startTime": "2023-01-01T00:00:00Z",
  "endTime": "2023-01-01T00:10:00Z",
  "actualTimeWatched": "00:08:30",
  "percentageWatched": 85,
  "userEvent": [
    {
      "event": "play",
      "eventTime": "2023-01-01T00:00:00Z",
      "videoTime": "00:00:00"
    },
    {
      "event": "pause",
      "eventTime": "2023-01-01T00:05:00Z",
      "videoTime": "00:05:00"
    }
  ],
  "userMetadata": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1",
    "device": "desktop",
    "browser": "Chrome",
    "os": "Windows",
    "deviceType": "desktop"
  }
}
```

### Updating a Watch Session

```typescript
PATCH /watch-sessions/:id

Body:
{
  "endTime": "2023-01-01T00:15:00Z",
  "actualTimeWatched": "00:12:30",
  "percentageWatched": 95,
  "userEvent": [
    // Updated user events array
  ]
}
```

### Getting Watch Sessions for a User

```typescript
GET /watch-sessions/user/:userId
```

### Getting Watch Sessions for a User Session

```typescript
GET /watch-sessions/user-session/:userSessionId
```
