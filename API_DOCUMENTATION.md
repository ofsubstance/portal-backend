# Substance Backend API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Videos](#videos)
- [Watch Sessions](#watch-sessions)
- [Comments](#comments)
- [Feedback](#feedback)
- [Shareable Links](#shareable-links)
- [Analytics](#analytics)
- [Content Metrics](#content-metrics)

## Standard Response Format
All API endpoints follow a standard response format:

### Success Response
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "Success message",
  "body": {
    // Response data
  }
}
```

### Error Response
```json
{
  "statusCode": 400-500,
  "timestamp": "2024-03-20T10:00:00Z",
  "path": "/api/endpoint",
  "message": "Error message"
}
```

## Authentication
Base URL: `/auth`

### Sign Up
```http
POST /auth/signup
```

**Request Body:**
```json
{
  "email": "example@gmail.com",
  "password": "123456",
  "smsConsent": true,
  "emailTermsConsent": true,
  "firstname": "John",
  "lastname": "Doe",
  "phone": "01712345678",
  "profile": {
    "businessName": "Dhaka",
    "website": "Dhaka",
    "stateRegion": "Dhaka",
    "country": "Bangladesh",
    "utilizationPurpose": "personal",
    "interests": ["1", "2"]
  }
}
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "User registered successfully",
  "body": {
    "id": "uuid",
    "email": "example@gmail.com",
    "firstname": "John",
    "lastname": "Doe",
    // ... other user fields
  }
}
```

### Login with Credentials
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "example@gmail.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "Login successful",
  "body": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "example@gmail.com",
      // ... other user fields
    }
  }
}
```

### Google Login
```http
POST /auth/google-login
```

**Request Body:**
```json
{
  "email": "client@gmail.com",
  "name": "client"
}
```

### Verify Email
```http
GET /auth/verify-email?token={token}
```

**Query Parameters:**
- `token` (string, required): Email verification token

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "Email verified successfully",
  "body": null
}
```

### Resend Verification Email
```http
POST /auth/resendVerification
```

**Request Body:**
```json
{
  "email": "example@gmail.com"
}
```

### Forgot Password
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "example@gmail.com"
}
```

## Users
Base URL: `/users`

### Get User by ID
```http
GET /users/{id}
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "User found",
  "body": {
    "id": "uuid",
    "name": "John Doe",
    "email": "example@gmail.com",
    "role": "admin",
    "address": "Dhaka",
    "phone_primary": "01700000000",
    "phone_secondary": "01700000001",
    "position": "Photographer",
    "verification_type": "NID",
    "verification_id": "12345678901234567",
    "base_salary": 5000,
    "monthly_salary": 10000,
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

### Get All Users
```http
GET /users
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "Users found",
  "body": [
    {
      "id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "last_login": "2024-03-20T10:00:00Z",
      "first_content_engagement": "2024-03-20T10:00:00Z",
      "role": "user",
      "status": "active",
      "sms_consent": true,
      "email_consent": true,
      "createdAt": "2024-03-20T10:00:00Z",
      "updatedAt": "2024-03-20T10:00:00Z",
      "profile": {
        "id": "uuid",
        "business_name": "Example Business",
        "website": "https://example.com",
        "state_region": "California",
        "country": "USA",
        "utilization_purpose": "education",
        "interests": ["technology", "education"]
      }
    }
  ]
}
```

**Response Fields:**
- User fields:
  - `id`: Unique identifier for the user
  - `firstname`: User's first name
  - `lastname`: User's last name
  - `email`: User's email address
  - `phone`: User's phone number
  - `last_login`: Timestamp of last login
  - `first_content_engagement`: Timestamp of first content engagement
  - `role`: User role (e.g., "user", "admin")
  - `status`: Account status
  - `sms_consent`: Whether user consented to SMS
  - `email_consent`: Whether user consented to email
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last update timestamp
- Profile fields:
  - `id`: Unique identifier for the profile
  - `business_name`: Name of the business
  - `website`: Business website
  - `state_region`: State or region
  - `country`: Country
  - `utilization_purpose`: Purpose of using the platform
  - `interests`: Array of user interests

### Update User
```http
PATCH /users/{id}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "example@gmail.com",
  "password": "123456",
  "role": "admin",
  "address": "Dhaka",
  "phone_primary": "01700000000",
  "phone_secondary": "01700000001",
  "position": "Photographer",
  "verification_type": "NID",
  "verification_id": "12345678901234567",
  "base_salary": 5000,
  "monthly_salary": 10000
}
```

### Delete User
```http
DELETE /users/{id}
```

### Update First Content Engagement
```http
PATCH /users/{id}/content-engagement
```

### Get User Engagement Data
```http
GET /users/{id}/engagement
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "User engagement data retrieved successfully",
  "body": {
    "sessionStats": {
      "totalSessions": 50,
      "activeSessions": 2,
      "engagedSessions": 40,
      "averageSessionDuration": 45,
      "lastSessionDate": "2024-03-20T10:00:00Z",
      "engagementRate": 80
    },
    "watchStats": {
      "totalWatchSessions": 100,
      "totalWatchTimeMinutes": 300,
      "averageWatchPercentage": 75,
      "completedVideos": 60,
      "partiallyWatchedVideos": 30,
      "brieflyWatchedVideos": 10,
      "uniqueVideosWatched": 25,
      "completionRate": 60
    },
    "videoSpecificStats": [
      {
        "videoId": "uuid",
        "videoTitle": "Video Title",
        "totalSessions": 10,
        "completedSessions": 8,
        "totalWatchTimeMinutes": 45,
        "averageWatchPercentage": 85,
        "lastWatched": "2024-03-20T10:00:00Z"
      }
    ],
    "shareableLinks": {
      "totalLinks": 5,
      "totalViews": 150,
      "totalUniqueVisitors": 120,
      "links": [
        {
          "id": "uuid",
          "video": {
            "id": "uuid",
            "title": "Video Title"
          },
          "views": 30,
          "uniqueVisitors": 25,
          "createdAt": "2024-03-20T10:00:00Z",
          "expirationTime": "2024-04-20T10:00:00Z",
          "totalEngagements": 35,
          "lastEngagement": "2024-03-20T15:00:00Z"
        }
      ]
    },
    "engagementTrends": {
      "last30Days": {
        "totalWatchSessions": 20,
        "totalWatchTimeMinutes": 60,
        "averageWatchPercentage": 78,
        "uniqueVideosWatched": 8
      }
    }
  }
}
```

**Response Fields:**
- `sessionStats`:
  - `totalSessions`: Total number of user sessions
  - `activeSessions`: Number of currently active sessions
  - `engagedSessions`: Number of sessions with content engagement
  - `averageSessionDuration`: Average session duration in minutes
  - `lastSessionDate`: Date of the most recent session
  - `engagementRate`: Percentage of sessions with engagement
- `watchStats`:
  - `totalWatchSessions`: Total number of video watch sessions
  - `totalWatchTimeMinutes`: Total time spent watching videos in minutes
  - `averageWatchPercentage`: Average percentage of videos watched
  - `completedVideos`: Number of videos watched 80% or more
  - `partiallyWatchedVideos`: Number of videos watched between 20% and 80%
  - `brieflyWatchedVideos`: Number of videos watched less than 20%
  - `uniqueVideosWatched`: Number of unique videos watched
  - `completionRate`: Percentage of completed video sessions
- `videoSpecificStats`: Array of per-video statistics:
  - `videoId`: Video identifier
  - `videoTitle`: Title of the video
  - `totalSessions`: Total watch sessions for this video
  - `completedSessions`: Number of completed sessions (≥80%)
  - `totalWatchTimeMinutes`: Total watch time for this video
  - `averageWatchPercentage`: Average watch percentage
  - `lastWatched`: Most recent watch date
- `shareableLinks`:
  - `totalLinks`: Total number of shareable links created
  - `totalViews`: Total views across all links
  - `totalUniqueVisitors`: Total unique visitors across all links
  - `links`: Array of link details:
    - `views`: Number of views for this link
    - `uniqueVisitors`: Number of unique visitors
    - `totalEngagements`: Total number of engagements
    - `lastEngagement`: Most recent engagement date
- `engagementTrends`:
  - `last30Days`: Engagement metrics for the last 30 days:
    - `totalWatchSessions`: Number of watch sessions
    - `totalWatchTimeMinutes`: Total watch time in minutes
    - `averageWatchPercentage`: Average watch percentage
    - `uniqueVideosWatched`: Number of unique videos watched

## Videos
Base URL: `/video`

### Get All Videos
```http
GET /video
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "Videos found",
  "body": [
    {
      "id": "uuid",
      "video_url": "string",
      "trailer_url": "string",
      "preroll_url": "string",
      "thumbnail": "url",
      "title": "Hide your Crazy",
      "genre": "123456",
      "duration": "18:54",
      "short_desc": "random text",
      "about": "Random about",
      "primary_lesson": "Random primary lesson",
      "theme": "Random about",
      "impact": "Random about",
      "tags": ["educational", "inspirational"],
      "createdAt": "2024-03-20T10:00:00Z",
      "updatedAt": "2024-03-20T10:00:00Z"
    }
  ]
}
```

### Get Video by ID
```http
GET /video/{id}
```

### Get Videos by Genre
```http
GET /video/genre/{genre}
```

### Create/Update Video
```http
POST /video
```

**Request Body (multipart/form-data):**
```json
{
  "video_url": "string",
  "trailer_url": "string",
  "preroll_url": "string",
  "thumbnail": "File",
  "title": "Hide your Crazy",
  "genre": "123456",
  "duration": "18:54",
  "short_desc": "random text",
  "about": "Random about",
  "primary_lesson": "Random primary lesson",
  "theme": "Random about",
  "impact": "Random about",
  "tags": ["educational", "inspirational"]
}
```

## Watch Sessions
Base URL: `/watch-sessions`

### Create Watch Session
```http
POST /watch-sessions
```

**Request Body:**
```json
{
  "userSessionId": "string",
  "isGuestWatchSession": false,
  "videoId": "string",
  "startTime": "2024-03-20T10:00:00Z",
  "endTime": "2024-03-20T10:30:00Z",
  "actualTimeWatched": 1800,
  "percentageWatched": 100,
  "userEvent": [],
  "userMetadata": {}
}
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "Watch session created successfully",
  "body": {
    "id": "uuid",
    "userSessionId": "string",
    "videoId": "string",
    "startTime": "2024-03-20T10:00:00Z",
    "endTime": "2024-03-20T10:30:00Z",
    "actualTimeWatched": 1800,
    "percentageWatched": 100,
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

### Update Watch Session
```http
PATCH /watch-sessions/{id}
```

**Request Body:**
```json
{
  "userSessionId": "string",
  "isGuestWatchSession": false,
  "videoId": "string",
  "startTime": "2024-03-20T10:00:00Z",
  "endTime": "2024-03-20T10:30:00Z",
  "actualTimeWatched": 1800,
  "percentageWatched": 100,
  "userEvent": [],
  "userMetadata": {}
}
```

## Comments
Base URL: `/comments`

### Create Comment
```http
POST /comments
```

**Request Body:**
```json
{
  "text": "This video was very insightful!",
  "videoId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Update Comment Status
```http
PATCH /comments/{id}/status
```

**Request Body:**
```json
{
  "status": "Approved"
}
```

## Feedback
Base URL: `/feedback`

### Create Feedback
```http
POST /feedback
```

**Request Body:**
```json
{
  "videoId": "123e4567-e89b-12d3-a456-426614174000",
  "engagementLevel": 5,
  "subjectMatterUsefulness": 4,
  "outcomeImprovement": 3,
  "continueUsageLikelihood": 2,
  "recommendLikelihood": 1,
  "openEndedFeedback": "Really great film. I thoroughly enjoyed it."
}
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "Feedback submitted successfully",
  "body": {
    "id": "uuid",
    "videoId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "uuid",
    "engagementLevel": 5,
    "subjectMatterUsefulness": 4,
    "outcomeImprovement": 3,
    "continueUsageLikelihood": 2,
    "recommendLikelihood": 1,
    "openEndedFeedback": "Really great film. I thoroughly enjoyed it.",
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

### Get Feedback by ID
```http
GET /feedback/{id}
```

## Shareable Links
Base URL: `/sharelinks`

### Get All Share Links
```http
GET /sharelinks
```

### Create Share Link
```http
POST /sharelinks
```

**Request Body:**
```json
{
  "validity_days": 30,
  "video_id": "string"
}
```

### Get Share Link by Unique Link
```http
GET /sharelinks/unique/{uniqueLink}
```

### Get Share Links by User
```http
GET /sharelinks/user/{userId}
```

### Get Share Link by ID
```http
GET /sharelinks/{id}
```

### Track Link Engagement
```http
POST /sharelinks/{id}/track
```

**Request Body:**
```json
{
  "ip_address": "string",
  "user_agent": "string",
  "referrer": "string"
}
```

## Analytics
Base URL: `/analytics`

Various analytics endpoints are available for admin users to track platform metrics.

## Content Metrics
Base URL: `/metrics/content`

### Get Content Metrics
```http
GET /metrics/content
```

**Query Parameters:**
```json
{
  "startDate": "2025-03-01",
  "endDate": "2025-04-31",
  "span": "DAILY" // Enum: DAILY, WEEKLY, MONTHLY
}
```

**Response:**
```json
{
  "statusCode": 200,
  "isSuccess": true,
  "message": "Content metrics retrieved successfully",
  "body": {
    "startDate": "2025-03-01",
    "endDate": "2025-04-31",
    "metrics": {
      "totalViews": 1000,
      "averageWatchTime": 1500,
      "completionRate": 75.5,
      // ... other metrics
    }
  }
}
```

## General Notes

1. Authentication:
   - Most endpoints require authentication via Bearer token in the Authorization header
   - Format: `Authorization: Bearer <token>`
   - Some endpoints are marked with `@Public()` and don't require authentication
   - Admin-only endpoints are protected with `@Roles(Role.Admin)`

2. Error Handling:
   - 400: Bad Request - Invalid input
   - 401: Unauthorized - Missing or invalid authentication
   - 403: Forbidden - Insufficient permissions
   - 404: Not Found - Resource doesn't exist
   - 500: Internal Server Error - Server-side error

3. Base Entity Fields:
   All entities include these base fields:
   ```json
   {
     "id": "uuid",
     "createdAt": "timestamp",
     "updatedAt": "timestamp",
     "isDeleted": boolean
   }
   ```

4. Pagination:
   List endpoints support pagination through query parameters:
   ```
   ?page=1&limit=10
   ```

5. Date Formats:
   - All dates are in ISO 8601 format
   - Example: "2024-03-20T10:00:00Z" 