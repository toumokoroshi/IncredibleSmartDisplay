# Calendar Worker Contract

This document fixes the future `/api/calendar` contract before Cloudflare Pages / Workers are implemented.
Do not add real Worker code, secrets, calendar IDs, private URLs, OAuth tokens, or real event details until the access-control model is verified.

## Endpoint

```text
GET /api/calendar
```

The endpoint must return normalized `CalendarData`. It must not return Google Calendar API payloads, provider-specific error payloads, token metadata, private calendar IDs, or raw OAuth state.

## Initial Privacy Mode

Initial private calendar mode is busy block only.

Rules:

- Event title must be the fixed display label `予定あり`.
- `location` must be omitted.
- `calendarName` must be omitted.
- Attendee, organizer, description, meet link, conference data, reminder, visibility, and calendar identifier fields must not be present.
- Busy block data is private data. It must not be cached in `localStorage`.
- Failed private fetches must not display stale private data.

Example success payload:

```json
{
  "items": [
    {
      "id": "busy-2026-05-30-0900",
      "title": "予定あり",
      "startsAt": "2026-05-30T09:00:00+09:00",
      "endsAt": "2026-05-30T10:00:00+09:00"
    }
  ]
}
```

## Error Payload

Worker errors must use the shared structured error shape.

```json
{
  "error": {
    "code": "AUTH_ERROR",
    "message": "Reauthentication required",
    "retryable": false
  }
}
```

Rules:

- `code` must be one of the frontend `WidgetErrorCode` values.
- `message` must be safe for UI and logs.
- Provider responses, request headers, Authorization values, tokens, private URLs, event titles, locations, and calendar names must not appear in the error response.

## Frontend Settings

Normal operation remains `provider: "localDate"` until Cloudflare Access and home IP bypass are verified.

Future private settings must opt out of persistent cache:

```ts
{
  provider: "workerJson",
  url: "/api/calendar",
  privateData: true
}
```

`privateData: true` means the widget must not read or write `localStorage` cache for this provider response.
