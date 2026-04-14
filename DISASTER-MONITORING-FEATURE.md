# Real-Time Disaster Monitoring Map

A comprehensive real-time disaster monitoring and response coordination feature for the Disaster Aid platform.

---

## Overview

This feature adds an interactive map-based disaster monitoring system with live alerts, zone visualization, and an emergency command center dashboard. It provides first responders and coordinators with a real-time operational picture of active disaster situations.

## Architecture

### Backend (Spring Boot)

```
disaster-aid-backend/
└── src/main/java/.../alert/
    ├── entity/
    │   ├── Alert.java            # Core alert entity (JPA)
    │   ├── AlertType.java        # Enum: EARTHQUAKE, FLOOD, WILDFIRE, STORM, LANDSLIDE, TSUNAMI, VOLCANIC, OTHER
    │   ├── AlertSeverity.java    # Enum: CRITICAL, HIGH, MEDIUM, LOW
    │   └── AlertStatus.java      # Enum: ACTIVE, MONITORING, RESOLVED
    ├── repository/
    │   └── AlertRepository.java  # Spring Data JPA queries
    ├── service/
    │   └── AlertService.java     # Business logic, joins Alert with DisasterStatistics
    ├── controller/
    │   └── AlertController.java  # REST endpoints under /api/alerts
    └── dto/
        ├── AlertWithStatsDto.java  # Alert + associated statistics
        ├── AlertRequestDto.java    # Create/update request body
        └── MapSummaryDto.java      # Aggregated KPI summary
```

### Frontend (Angular 19)

```
disaster-aid-frontend/
└── src/app/
    ├── modules/analytics/
    │   ├── models/
    │   │   └── alert.model.ts        # TypeScript interfaces
    │   └── services/
    │       └── alert.service.ts      # HTTP client for alert endpoints
    └── pages/
        ├── alerts-map/
        │   ├── alerts-map.component.ts     # Leaflet map with markers & zones
        │   ├── alerts-map.component.html   # Map UI, sidebar, detail panel
        │   └── alerts-map.component.scss   # Dark theme map styling
        └── emergency-dashboard/
            ├── emergency-dashboard.component.ts    # Command center dashboard
            ├── emergency-dashboard.component.html  # KPIs, tables, alert cards
            └── emergency-dashboard.component.scss
```

## API Endpoints

All endpoints are prefixed with `/api/alerts` and return the standard `ApiResponse<T>` wrapper.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/alerts` | List all alerts |
| `GET` | `/api/alerts/active` | List active alerts only |
| `GET` | `/api/alerts/with-stats` | List alerts joined with latest statistics |
| `GET` | `/api/alerts/{id}/with-stats` | Single alert with statistics |
| `GET` | `/api/alerts/map-summary` | Aggregated KPIs for the map overview |
| `POST` | `/api/alerts` | Create a new alert |
| `PUT` | `/api/alerts/{id}` | Update an existing alert |
| `DELETE` | `/api/alerts/{id}` | Delete an alert |

### Response Models

**Alert**
```json
{
  "alertId": 1,
  "title": "Tunis Flash Floods",
  "description": "...",
  "type": "FLOOD",
  "severity": "CRITICAL",
  "status": "ACTIVE",
  "latitude": 36.8065,
  "longitude": 10.1815,
  "radiusKm": 15.0,
  "region": "Tunis",
  "country": "Tunisia",
  "reportedAt": "2025-01-15T08:30:00",
  "resolvedAt": null
}
```

**AlertWithStats**
```json
{
  "alert": { ... },
  "latestStats": {
    "statId": 1,
    "alertId": 1,
    "totalReports": 245,
    "verifiedReports": 180,
    "totalHelpRequests": 120,
    "resolvedRequests": 45,
    "activeResponders": 35,
    "shelterOccupancy": "{\"School A\":75,\"Sports Hall\":45}",
    "avgResponseTimeMin": 12.5,
    "affectedAreaKm2": 180.0,
    "computedAt": "2025-01-15T10:00:00"
  }
}
```

**MapSummary**
```json
{
  "activeAlerts": 3,
  "monitoringAlerts": 2,
  "resolvedAlerts": 1,
  "totalResponders": 85,
  "totalHelpRequests": 320,
  "resolvedRequests": 145
}
```

## Frontend Pages

### 1. Alerts Map (`/alerts`)

An interactive full-screen Leaflet map with dark CARTO tiles showing:

- **Marker pins** — Color-coded by severity with disaster type icons. Critical alerts pulse.
- **Zone circles** — Radius visualization based on `radiusKm`. Monitoring zones use dashed borders.
- **Sidebar panel** — Command overview KPIs (active/watching/resolved counts, responder count, resolution rate) and a scrollable alert list with mini stats.
- **Detail panel** — Slides up on alert selection showing full stats grid (reports, help requests, responders, response time, affected area, zone radius) and shelter occupancy bars.
- **Live polling** — Auto-refreshes every 30 seconds.

### 2. Emergency Dashboard (`/emergency`)

A tabular command center view showing:

- **KPI cards** — Active, monitoring, resolved counts, total responders, reports, help requests with resolution progress bar.
- **Critical alerts banner** — Highlighted red cards for CRITICAL severity alerts requiring immediate attention.
- **Alerts table** — All active and monitoring alerts with type icon, severity badge, status badge, reports, help requests, responders, average response time, and time since reported.
- **Resolved section** — Grid of recently resolved alerts with green styling.
- **Live polling** — Same 30-second auto-refresh as the map.

## Severity Color System

| Severity | Color | Hex |
|----------|-------|-----|
| CRITICAL | Red | `#ff6e84` |
| HIGH | Orange | `#f97316` |
| MEDIUM | Amber | `#f59e0b` |
| LOW | Blue | `#699cff` |

## Disaster Type Icons

| Type | Material Symbol |
|------|-----------------|
| EARTHQUAKE | `earthquake` |
| FLOOD | `flood` |
| WILDFIRE | `local_fire_department` |
| STORM | `thunderstorm` |
| LANDSLIDE | `landslide` |
| TSUNAMI | `tsunami` |
| VOLCANIC | `volcano` |
| OTHER | `warning` |

## Seed Data

The backend ships with 6 seed alerts in `data.sql` covering Tunisia:

1. **Tunis Flash Floods** — CRITICAL / ACTIVE
2. **Sfax Earthquake** — HIGH / ACTIVE
3. **Cap Bon Wildfire** — HIGH / MONITORING
4. **Sousse Coastal Storm** — MEDIUM / ACTIVE
5. **Bizerte Landslide Risk** — MEDIUM / MONITORING
6. **Kairouan Drought Emergency** — LOW / RESOLVED

## Dependencies

### Backend
- Spring Boot 4.0.4
- Spring Data JPA
- MySQL 8+
- Lombok

### Frontend
- Angular 19
- Leaflet (`leaflet` + `@types/leaflet`)
- Tailwind CSS (custom dark theme)
- Material Symbols Outlined (icons)

## Configuration

### Backend
Ensure these properties are set in `application.properties`:
```properties
spring.sql.init.mode=always
spring.jpa.defer-datasource-initialization=true
```

### Frontend
Leaflet CSS is included in `angular.json` under the build styles array:
```json
"node_modules/leaflet/dist/leaflet.css"
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/alerts` | `AlertsMapComponent` | Interactive disaster map |
| `/emergency` | `EmergencyDashboardComponent` | Command center dashboard |

Both are accessible from the sidebar navigation under the authenticated layout.
