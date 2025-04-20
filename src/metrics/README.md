# Metrics Module

This module provides analytics and metrics for the application, helping to track and understand user behavior and application performance.

## Features

- Session metrics for analyzing user engagement and session duration
- Flexible time spans for metrics (daily, weekly, monthly)
- Analytics across all users in the system
- Organized metrics in categories for better API structure

## Module Structure

The metrics module is organized into categories:

- **Performance Metrics**: User activity, growth rates, and retention
- **Session Metrics**: Session counts, duration, and engagement
- **Distribution Metrics**: User interests and utilization purpose distribution

## API Endpoints

### Performance Metrics

#### `GET /metrics/performance/active-users/daily`

Get daily active users for a specific date.

**Query Parameters:**

- `date` - Date in ISO format (YYYY-MM-DD). Default is current date.

#### `GET /metrics/performance/active-users/monthly`

Get monthly active users for a specific month.

**Query Parameters:**

- `date` - Date in ISO format (YYYY-MM-DD). Default is current month.

#### `GET /metrics/performance/active-users/trend`

Get active user trends aggregated by the specified time period.

**Query Parameters:**

- `startDate` - Start date in ISO format (YYYY-MM-DD)
- `endDate` - End date in ISO format (YYYY-MM-DD)
- `span` - Time span for aggregation (daily, weekly, monthly). Default: daily

**Response:**

```json
{
  "status": "success",
  "message": "daily active users trend retrieved successfully",
  "data": {
    "startDate": "2023-01-01",
    "endDate": "2023-01-31",
    "span": "daily",
    "data": [
      {
        "date": "2023-01-01",
        "count": 45
      },
      {
        "date": "2023-01-02",
        "count": 52
      }
    ]
  }
}
```

#### `GET /metrics/performance/growth/trend`

Get user growth rate trends aggregated by the specified time period.

**Query Parameters:**

- `startDate` - Start date in ISO format (YYYY-MM-DD)
- `endDate` - End date in ISO format (YYYY-MM-DD)
- `span` - Time span for aggregation (daily, weekly, monthly). Default: monthly

**Response:**

```json
{
  "status": "success",
  "message": "monthly user growth rate trend retrieved successfully",
  "data": {
    "startDate": "2023-01",
    "endDate": "2023-06",
    "span": "monthly",
    "data": [
      {
        "month": "2023-01",
        "userCount": 250,
        "growthRate": 0,
        "previousPeriodCount": 250
      },
      {
        "month": "2023-02",
        "userCount": 280,
        "growthRate": 12.0,
        "previousPeriodCount": 250
      }
    ]
  }
}
```

#### `GET /metrics/performance/growth/monthly`

Get monthly growth rate.

**Query Parameters:**

- `startDate` - Start date in ISO format (YYYY-MM-DD)
- `endDate` - End date in ISO format (YYYY-MM-DD)

#### `GET /metrics/performance/retention`

Get user retention rates.

**Query Parameters:**

- `startDate` - Start date in ISO format (YYYY-MM-DD)
- `endDate` - End date in ISO format (YYYY-MM-DD)

### Session Metrics

#### `GET /metrics/sessions`

Get aggregated session metrics between date ranges for all users.

**Query Parameters:**

- `startDate` - Start date in ISO format (YYYY-MM-DD)
- `endDate` - End date in ISO format (YYYY-MM-DD)

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalSessions": 120,
    "averageDurationMinutes": 12.5,
    "totalDurationMinutes": 1500,
    "engagedSessions": 85,
    "engagementRate": 70.83,
    "startDate": "2023-01-01T00:00:00.000Z",
    "endDate": "2023-01-31T23:59:59.999Z"
  }
}
```

#### `GET /metrics/sessions/by-timespan`

Get session metrics aggregated by the specified time period (daily, weekly, or monthly).

**Query Parameters:**

- `startDate` - Start date in ISO format (YYYY-MM-DD)
- `endDate` - End date in ISO format (YYYY-MM-DD)
- `span` - Time span for aggregation (daily, weekly, monthly). Default: daily

**Response for daily span:**

```json
{
  "status": "success",
  "data": [
    {
      "period": "2023-01-01",
      "date": "2023-01-01",
      "sessions": 5,
      "engagedSessions": 3,
      "engagementRate": 60
    },
    {
      "period": "2023-01-02",
      "date": "2023-01-02",
      "sessions": 8,
      "engagedSessions": 6,
      "engagementRate": 75
    }
  ]
}
```

**Response for weekly span:**

```json
{
  "status": "success",
  "data": [
    {
      "period": "2023-01-01",
      "week": "2023-01-01",
      "sessions": 35,
      "engagedSessions": 22,
      "engagementRate": 62.85
    },
    {
      "period": "2023-01-08",
      "week": "2023-01-08",
      "sessions": 42,
      "engagedSessions": 31,
      "engagementRate": 73.81
    }
  ]
}
```

**Response for monthly span:**

```json
{
  "status": "success",
  "data": [
    {
      "period": "2023-01",
      "month": "2023-01",
      "sessions": 120,
      "engagedSessions": 85,
      "engagementRate": 70.83
    },
    {
      "period": "2023-02",
      "month": "2023-02",
      "sessions": 145,
      "engagedSessions": 112,
      "engagementRate": 77.24
    }
  ]
}
```

#### `GET /metrics/sessions/daily`

Get daily session counts and engagement between date ranges for all users.

**Query Parameters:**

- `startDate` - Start date in ISO format (YYYY-MM-DD)
- `endDate` - End date in ISO format (YYYY-MM-DD)

### Distribution Metrics

#### `GET /metrics/distribution/utilization`

Get the distribution of users by utilization purpose.

**Response:**

```json
{
  "status": "success",
  "message": "User utilization purpose distribution retrieved successfully",
  "data": {
    "totalUsers": 350,
    "data": [
      {
        "purpose": "personal",
        "count": 180,
        "percentage": 51.43
      },
      {
        "purpose": "business",
        "count": 120,
        "percentage": 34.29
      },
      {
        "purpose": "education",
        "count": 50,
        "percentage": 14.28
      }
    ]
  }
}
```

#### `GET /metrics/distribution/interests`

Get the distribution of user interests.

#### `GET /metrics/distribution/interests-overlap`

Get analysis of which interests commonly overlap among users.

## Example Frontend Code

```javascript
// Get session metrics by timespan
const getSessionMetricsByTimespan = async (
  startDate,
  endDate,
  span = 'daily',
) => {
  try {
    const url = `/metrics/sessions/by-timespan?startDate=${startDate}&endDate=${endDate}&span=${span}`;

    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch session metrics', error);
    return null;
  }
};

// Get active users trend
const getActiveUsersTrend = async (startDate, endDate, span = 'daily') => {
  try {
    const url = `/metrics/performance/active-users/trend?startDate=${startDate}&endDate=${endDate}&span=${span}`;

    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch active users trend', error);
    return null;
  }
};

// Example: Display metrics on a dashboard with different time spans
const displayMetricsDashboard = async (timespan = 'daily') => {
  // Get metrics for the appropriate time range
  const today = new Date();
  let startDate = new Date();

  switch (timespan) {
    case 'weekly':
      // Go back 8 weeks
      startDate.setDate(today.getDate() - 56);
      break;
    case 'monthly':
      // Go back 6 months
      startDate.setMonth(today.getMonth() - 6);
      break;
    case 'daily':
    default:
      // Go back 30 days
      startDate.setDate(today.getDate() - 30);
      break;
  }

  const formattedToday = today.toISOString().split('T')[0];
  const formattedStartDate = startDate.toISOString().split('T')[0];

  // Get metrics with the selected timespan
  const metrics = await getSessionMetricsByTimespan(
    formattedStartDate,
    formattedToday,
    timespan,
  );

  // Get active users trend with the selected timespan
  const activeUsersTrend = await getActiveUsersTrend(
    formattedStartDate,
    formattedToday,
    timespan,
  );

  // Process and display data based on the selected timespan
  renderChart(
    'Sessions Over Time',
    metrics.map((item) => item.period),
    metrics.map((item) => item.sessions),
  );
  renderChart(
    'Active Users Over Time',
    activeUsersTrend.data.map((item) => item.date || item.week || item.month),
    activeUsersTrend.data.map((item) => item.count),
  );
};
```
