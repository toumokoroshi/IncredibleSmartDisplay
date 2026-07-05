# Kiosk Private Access Checklist

Use this checklist after the home fiber line and router are ready. Do not record real IP addresses, tokens, calendar IDs, private URLs, or personal event details in this document.

## Current Preconditions

- Normal `dashboard.config.ts` calendar provider remains `localDate`.
- Private calendar data is not enabled in production config.
- `/api/calendar` exists only as a documented contract and tests, not as a real Cloudflare endpoint.
- Cloudflare API tokens, OAuth credentials, refresh tokens, and calendar identifiers are not present in frontend code, public JSON, `VITE_` variables, screenshots, or logs.

## Router And Network Capability

- Confirm whether the router can create a kiosk-only SSID.
- Confirm whether that SSID can be IPv4-only.
- Confirm whether guest/client isolation can be enabled for the kiosk SSID.
- If kiosk-only IPv4 SSID and isolation are reliable, prefer that path.
- If the router cannot provide those features, evaluate a separate kiosk domain / separate Cloudflare zone or home DNS AAAA suppression instead.

## IP And DNS Checks

- Confirm the home global IPv4 and whether it is fixed or dynamic.
- If the IPv4 is dynamic, design a server-side updater for the Cloudflare Zero Trust IP list before enabling private data.
- Confirm whether the tablet can use IPv6 with `test-ipv6.com`.
- Confirm the target hostname DNS `A` and `AAAA` behavior from a trusted admin machine.
- Confirm Cloudflare Access logs show the expected source IP for the tablet.
- Do not assume a single IPv6 `/128` for the tablet is stable.

## Cloudflare Access Checks

- External networks must require Cloudflare Access login.
- Home global IPv4 `/32` may bypass Access only after the accepted risk is documented.
- Old dynamic IPv4 entries must not remain allowlisted.
- Bypass means the home global IPv4 is trusted; it does not authenticate the tablet as a unique device.
- Fully Kiosk must not store Cloudflare service tokens or other long-lived secrets.

## Worker / API Checks

- `/api/health`, if added, returns public-safe status only.
- `/api/calendar` returns normalized `CalendarData` only.
- 401 and 403 responses become `AUTH_ERROR` in the dashboard.
- Error messages are safe for UI and logs.
- Worker logs do not contain provider payloads, Authorization headers, tokens, private URLs, calendar IDs, event titles, locations, or calendar names.

## Calendar Privacy Checks

- Initial private calendar mode is busy block only.
- Event title is the fixed label `予定あり`.
- `location` is omitted.
- `calendarName` is omitted.
- Busy block data is treated as private data.
- Private calendar data is not stored in `localStorage`.
- Private fetch failure does not display stale private calendar data.

## Fully Kiosk Checks

- Tablet reboot returns to the dashboard.
- Fully Kiosk restart returns to the dashboard.
- Wi-Fi disconnect and reconnect returns to the dashboard.
- The dashboard does not get stuck on a Cloudflare login page during normal kiosk operation.
- A 24-hour run remains readable and recoverable.
- A 7-day run remains readable and recoverable before enabling more detailed private fields.

## Go / No-Go

Go only when:

- External access requires Cloudflare Access login.
- Home kiosk access is stable without browser session cookie dependence.
- Dynamic IPv4 update, if needed, is server-side and tested.
- `/api/calendar` returns only busy block `CalendarData`.
- `AUTH_ERROR` is visible inside the dashboard.
- Private calendar data is not cached or displayed as stale data.

No-Go if:

- The tablet source IP switches unpredictably between IPv4 and IPv6.
- Fully Kiosk lands on an interactive login page and cannot recover.
- Worker responses or logs expose private calendar details.
- Any private data appears in frontend config, public JSON, localStorage, screenshots, or logs.
