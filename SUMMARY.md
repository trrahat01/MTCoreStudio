# Visitor Device Tracking Implementation

## Overview
Added visitor device tracking capability to the MT Core Studio admin panel to show which devices (Android, iOS, Windows, Mac, etc.) are being used to access the website.

## Files Created/Modified

### Main Site (`mt-core-studio`):
1. **`meher/track.php`** - New endpoint to receive and store device tracking data
2. **`meher/stats.php`** - New endpoint to retrieve stored device statistics
3. **`meher/index.php`** - Added device stats section to admin dashboard
4. **`meher/admin.js`** - Added JavaScript to load and display device stats
5. **`js/main.js`** - Added frontend tracking code to send device data to `/meher/track.php`
6. **`data/` directory** - Ensured exists for storing device-stats.json

### Test Site (`mkl/_test-site`):
1. **`meher/track.php`** - New endpoint to receive and store device tracking data
2. **`meher/stats.php`** - New endpoint to retrieve stored device statistics
3. **`meher/index.php`** - Added device stats section to admin dashboard
4. **`meher/admin.js`** - Added JavaScript to load and display device stats
5. **`js/main.js`** - Added frontend tracking code to send device data to `/meher/track.php`
6. **`data/` directory** - Ensured exists for storing device-stats.json

## Features

### Tracking Mechanism:
- Frontend (main.js) sends visitor's user agent to `/meher/track.php` on first page load per session
- Tracking avoids duplicates using sessionStorage
- Localhost/dev environments are automatically skipped to prevent skewing stats

### Data Storage:
- Device data stored in `data/device-stats.json` as JSON array
- Each record includes: timestamp, deviceType, os, browser, and full userAgent
- Limited to most recent 1,000 entries to prevent excessive file growth

### User Agent Parsing:
- Detects device type: mobile, tablet, desktop
- Identifies operating system: Windows, Android, iOS, Mac OS, Linux, etc.
- Identifies browser: Chrome, Firefox, Safari, Edge, Opera, Internet Explorer

### Admin Dashboard Integration:
- New "Visitor Device Stats" section in the admin console
- Displays:
  - Summary statistics (total visits, breakdown by device/OS/browser)
  - Recent visits table (last 10 visitors with time, device, OS, browser)
  - Refresh button to update stats without page reload
  - Loading/error states for user feedback

## Privacy Considerations:
- Only stores user agent string (no IP addresses or personal data)
- Data is aggregated and anonymized for statistical purposes
- Session-based tracking prevents over-counting individual users
- Localhost access is excluded from tracking

## Implementation Notes:
- Follows existing code patterns and conventions in the project
- Uses vanilla JavaScript (no additional dependencies)
- Graceful error handling for network failures
- Responsive table layout for recent visits
- Clear visual feedback for loading, success, and error states

## Usage:
1. Visit any page on the live website to trigger tracking (first visit per session)
2. Log in to the admin panel at `/meher/index.php`
3. Navigate to the "Visitor Device Stats" section in the dashboard
4. Click "Refresh" to load the latest statistics
5. View summary breakdowns and recent visitor details

## Data Example:
Stored JSON format in `data/device-stats.json`:
```json
[
  {
    "timestamp": "2026-10-09T14:30:00+00:00",
    "deviceType": "mobile",
    "os": "Android",
    "browser": "Chrome",
    "userAgent": "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
  }
]
```