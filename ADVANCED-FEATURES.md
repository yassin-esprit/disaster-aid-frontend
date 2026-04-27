# Advanced Analytics Features

Documentation for all 7 advanced features implemented across the Disaster Aid platform.

---

## Table of Contents

1. [SLA Performance Tracking](#1-sla-performance-tracking)
2. [Disaster Comparison](#2-disaster-comparison)
3. [Rule Engine](#3-rule-engine)
4. [Data Quality Analysis](#4-data-quality-analysis)
5. [Historical Risk Zones](#5-historical-risk-zones)
6. [WebSocket Real-Time](#6-websocket-real-time)
7. [Temporal Replay](#7-temporal-replay)
8. [Testing Guide](#testing-guide)

---

## 1. SLA Performance Tracking

**Route:** `/analytics/sla`

Measures the delays between each phase of incident handling: **incident** → **acknowledgement** → **resolution**.

### Backend

| File | Description |
|------|-------------|
| `alert/entity/SlaMetric.java` | Entity with `incidentAt`, `acknowledgedAt`, `resolvedAt` timestamps + computed delays |
| `alert/repository/SlaMetricRepository.java` | Queries: by alert, by status, aggregate KPIs |
| `alert/service/SlaService.java` | Summary computation (avg times, status counts) |
| `alert/controller/SlaController.java` | REST controller |
| `alert/dto/SlaSummaryDto.java` | Summary DTO |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sla` | All SLA metrics |
| `GET` | `/api/sla/alert/{alertId}` | Metrics for a specific alert |
| `GET` | `/api/sla/summary` | Aggregated KPIs (avg acknowledge, resolve, total times + status counts) |

### SLA Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| `WITHIN_SLA` | Green | Response within acceptable time |
| `AT_RISK` | Amber | Approaching SLA breach |
| `BREACHED` | Red | SLA target exceeded |

### Frontend

- 7 KPI cards (avg acknowledge, avg resolve, avg total, total incidents, within SLA, at risk, breached)
- Compliance rate bar (green/amber/red segments)
- Full metrics table with color-coded status badges

---

## 2. Disaster Comparison

**Route:** `/analytics/comparison`

Side-by-side comparison of two disaster events.

### Backend

| File | Description |
|------|-------------|
| `alert/dto/ComparisonDto.java` | DTO with two `AlertSide` objects (alert + stats) |
| `alert/controller/ComparisonController.java` | Comparison endpoint |

### API Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/alerts/compare?alertIdA=1&alertIdB=2` | Compare two alerts |

### Response

```json
{
  "success": true,
  "data": {
    "alertA": { "alert": {...}, "stats": {...} },
    "alertB": { "alert": {...}, "stats": {...} }
  }
}
```

### Frontend

- Two dropdown selectors to pick alerts
- Comparison table with metrics: Total Reports, Help Requests, Resolved Requests, Active Responders, Avg Response Time, Severity
- Better values are highlighted in color (blue for A, teal for B)

---

## 3. Rule Engine

**Route:** `/analytics/rules`

Define business rules that automatically trigger actions on alerts.

### Backend

| File | Description |
|------|-------------|
| `alert/entity/AlertRule.java` | Rule entity with field, operator, threshold, action |
| `alert/repository/AlertRuleRepository.java` | JPA repository |
| `alert/service/RuleEngineService.java` | Rule CRUD + evaluation engine |
| `alert/controller/RuleEngineController.java` | REST controller |
| `alert/dto/RuleExecutionResult.java` | Evaluation result DTO |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/rules` | List all rules |
| `POST` | `/api/rules` | Create a rule |
| `PUT` | `/api/rules/{id}` | Update a rule |
| `DELETE` | `/api/rules/{id}` | Delete a rule |
| `POST` | `/api/rules/evaluate` | Evaluate all active rules against all active alerts |

### Rule Configuration

**Fields:** `TOTAL_REPORTS`, `HELP_REQUESTS`, `ACTIVE_RESPONDERS`, `AVG_RESPONSE_TIME`

**Operators:** `>`, `<`, `=`, `>=`, `<=`

**Actions:**
- `CHANGE_SEVERITY` — Changes the alert severity to the target value
- `NOTIFY` — Sends a notification (logged)
- `AUTO_RESOLVE` — Automatically resolves the alert

### Example Rule

> "If TOTAL_REPORTS > 100 then CHANGE_SEVERITY to CRITICAL"

### Frontend

- Rule list with condition display, action badges, active toggle, trigger count
- New Rule form with dropdowns for field/operator/action
- "Evaluate All Rules" button with results table showing which rules triggered on which alerts

---

## 4. Data Quality Analysis

**Route:** `/analytics/data-quality`

Scans all alert data for inconsistencies and reports issues.

### Backend

| File | Description |
|------|-------------|
| `alert/service/DataQualityService.java` | Scans alerts for 7 types of issues |
| `alert/controller/DataQualityController.java` | REST controller |
| `alert/dto/DataQualityReportDto.java` | Report DTO with quality score + issues list |

### API Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/data-quality/analyze` | Run full data quality scan |

### Checks Performed

| Category | Severity | What it detects |
|----------|----------|-----------------|
| `MISSING_LOCATION` | CRITICAL | Alert has null or zero coordinates |
| `MISSING_REGION` | WARNING | Alert has no region name |
| `STALE_ACTIVE` | WARNING | Alert ACTIVE for > 30 days |
| `MISSING_RESOLVED_DATE` | WARNING | Status is RESOLVED but `resolvedAt` is null |
| `MISSING_DESCRIPTION` | INFO | No description text |
| `LARGE_RADIUS` | WARNING | Radius > 200km (possibly incorrect) |
| `NO_STATISTICS` | INFO | Active alert has no disaster statistics |

### Frontend

- Quality score (0-100) with color coding
- Summary cards: total alerts, critical/warning/info issue counts
- Issue list with severity badges, category labels, and linked alert info

---

## 5. Historical Risk Zones

**Route:** `/analytics/risk-zones`

Identifies the most affected regions based on historical data.

### Backend

| File | Description |
|------|-------------|
| `alert/service/RiskZoneService.java` | Aggregates alerts by region, computes risk levels |
| `alert/controller/RiskZoneController.java` | REST controller |
| `alert/dto/RiskZoneDto.java` | DTO with region stats + risk level |

### API Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/risk-zones` | Get all risk zones ranked by severity |

### Risk Level Calculation

| Condition | Risk Level |
|-----------|-----------|
| 3+ active OR 5+ total alerts | CRITICAL |
| 2+ active OR 3+ total alerts | HIGH |
| 1+ active OR 2+ total alerts | MEDIUM |
| Otherwise | LOW |

### Frontend

- Summary: total regions, critical zones, total incidents
- Ranked region cards with risk level badge, active/resolved counts, disaster type tags, coordinates

---

## 6. WebSocket Real-Time

Replaces the 30-second polling with instant push notifications via STOMP over WebSocket.

### Backend

| File | Description |
|------|-------------|
| `config/WebSocketConfig.java` | STOMP endpoint at `/ws`, broker on `/topic` |
| `alert/service/AlertNotificationService.java` | Pushes messages on alert create/update/delete |

The `AlertService` was updated to call `AlertNotificationService` on every `createAlert()`, `updateAlert()`, and `deleteAlert()`.

### WebSocket Topics

| Topic | Payload | When |
|-------|---------|------|
| `/topic/alerts` | Full `Alert` JSON | Alert created or updated |
| `/topic/alerts/deleted` | `alertId` (integer) | Alert deleted |

### Frontend

| File | Description |
|------|-------------|
| `core/services/websocket.service.ts` | STOMP client with SockJS fallback, auto-reconnect |
| `pages/alerts-map/alerts-map.component.ts` | Subscribes to WebSocket, reloads map on events |

### How it works

1. On component init, the map connects to `ws://localhost:8081/ws` via SockJS
2. Subscribes to `/topic/alerts` and `/topic/alerts/deleted`
3. On any message, the map reloads all data instantly
4. The Live badge shows **green "WebSocket"** when connected, or **red "30s polling"** as fallback
5. 30-second polling runs as backup in case WebSocket fails

### Dependencies Added

```
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client
```

Maven (pom.xml):
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

---

## 7. Temporal Replay

Replay the evolution of a disaster over time (zone growth, severity changes, incident counts).

### Backend

| File | Description |
|------|-------------|
| `alert/entity/AlertSnapshot.java` | Timeline entity: status, severity, radius, stats at a point in time |
| `alert/repository/AlertSnapshotRepository.java` | Query snapshots ordered by time |
| `alert/controller/ReplayController.java` | REST endpoint |

### API Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/alerts/replay/{alertId}` | Get timeline snapshots for an alert |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "alertId": 1,
      "status": "ACTIVE",
      "severity": "MEDIUM",
      "radiusKm": 5.0,
      "totalReports": 12,
      "totalHelpRequests": 8,
      "activeResponders": 3,
      "snapshotAt": "2026-04-10T08:30:00"
    },
    {
      "severity": "HIGH",
      "radiusKm": 12.0,
      "totalReports": 120,
      "snapshotAt": "2026-04-10T18:00:00"
    }
  ]
}
```

### Seed Data

Timeline snapshots are seeded for alerts 1 (Tunis Floods - 5 snapshots) and 2 (Sfax Earthquake - 3 snapshots).

---

## Testing Guide

### Prerequisites

1. **MySQL** running on `localhost:3306` with database `disaster_aid`
2. **Backend** started: `cd disaster-aid-backend && ./mvnw spring-boot:run`
3. **Frontend** started: `cd disaster-aid-frontend && ng serve`

### Testing Each Feature

#### SLA Tracking
1. Go to `http://localhost:4200/analytics/sla`
2. You should see 4 seeded SLA metrics with a compliance bar
3. Verify the KPI cards show avg acknowledge/resolve times

#### Disaster Comparison
1. Go to `http://localhost:4200/analytics/comparison`
2. Select **"Tunis Flash Floods"** as Disaster A
3. Select **"Sfax Earthquake"** as Disaster B
4. Click **Compare** — the table should show side-by-side metrics

#### Rule Engine
1. Go to `http://localhost:4200/analytics/rules`
2. You should see 3 seeded rules
3. Click **"Evaluate All Rules"** — the results table shows which rules triggered
4. Click **"New Rule"** to create a custom rule:
   - Name: `Test Rule`
   - Field: `TOTAL REPORTS`
   - Operator: `> (GREATER THAN)`
   - Threshold: `50`
   - Action: `CHANGE SEVERITY`
   - Target: `CRITICAL`
5. Click **Save**, then **Evaluate All Rules** again

#### Data Quality
1. Go to `http://localhost:4200/analytics/data-quality`
2. You should see a quality score and a list of detected issues
3. Click **Re-Analyze** to refresh

#### Risk Zones
1. Go to `http://localhost:4200/analytics/risk-zones`
2. You should see region cards for Tunis, Sfax, Nabeul, Sousse, Bizerte, Kairouan
3. Each card shows total/active/resolved counts and disaster types

#### WebSocket Real-Time

This is the most important test to demonstrate real-time capabilities.

**Step 1:** Open the map at `http://localhost:4200/analytics/alerts`
- Check the Live badge in the top-right: it should show **green "WebSocket"**
- If it shows red "30s polling", the WebSocket connection failed — restart the backend

**Step 2:** Open **PowerShell** and run these 4 commands one at a time. Watch the map update **instantly** after each one:

---

**Command 1 — Create a CRITICAL Tsunami alert on Djerba (red marker appears instantly)**

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/alerts" -Method POST -ContentType "application/json" -Body '{"title":"Djerba Tsunami Warning","description":"Unusual seismic activity detected off the coast of Djerba. Coastal evacuations recommended.","type":"TSUNAMI","severity":"CRITICAL","status":"ACTIVE","latitude":33.8076,"longitude":10.8451,"radiusKm":35.0,"region":"Djerba","country":"Tunisia"}'
```

**Command 2 — Create a HIGH Wildfire alert in Tabarka (orange marker appears instantly)**

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/alerts" -Method POST -ContentType "application/json" -Body '{"title":"Tabarka Forest Fire","description":"Large wildfire spreading across Kroumirie mountains. 500 hectares already burned. Air support deployed.","type":"WILDFIRE","severity":"HIGH","status":"ACTIVE","latitude":36.9544,"longitude":8.7580,"radiusKm":18.0,"region":"Tabarka","country":"Tunisia"}'
```

**Command 3 — Create a MEDIUM Storm alert in Hammamet (amber marker appears instantly)**

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/alerts" -Method POST -ContentType "application/json" -Body '{"title":"Hammamet Severe Storm","description":"Category 2 storm approaching Hammamet coast with 120km/h winds. Tourist areas at risk.","type":"STORM","severity":"MEDIUM","status":"ACTIVE","latitude":36.4000,"longitude":10.6167,"radiusKm":22.0,"region":"Hammamet","country":"Tunisia"}'
```

**Command 4 — Create a LOW Landslide alert in Ain Draham (blue marker appears instantly)**

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/alerts" -Method POST -ContentType "application/json" -Body '{"title":"Ain Draham Landslide Risk","description":"Heavy rainfall saturating hillsides near Ain Draham. Minor mudslides reported on secondary roads.","type":"LANDSLIDE","severity":"LOW","status":"MONITORING","latitude":36.7833,"longitude":8.6833,"radiusKm":10.0,"region":"Ain Draham","country":"Tunisia"}'
```

---

**What to observe on the map after each command:**

| # | Alert | Marker Color | Zone Radius | Location |
|---|-------|-------------|-------------|----------|
| 1 | Djerba Tsunami | Red (pulsing) | 35km | South-east coast |
| 2 | Tabarka Wildfire | Orange | 18km | North-west mountains |
| 3 | Hammamet Storm | Amber | 22km | East coast |
| 4 | Ain Draham Landslide | Blue (dashed border) | 10km | North-west hills |

**Step 3 — Update an alert (marker changes color instantly)**

Change the Djerba Tsunami from CRITICAL to MEDIUM + MONITORING (replace `7` with the actual alertId returned by Command 1):

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/alerts/7" -Method PUT -ContentType "application/json" -Body '{"title":"Djerba Tsunami Warning","description":"Seismic activity subsiding. Monitoring continues but no further evacuations needed.","type":"TSUNAMI","severity":"MEDIUM","status":"MONITORING","latitude":33.8076,"longitude":10.8451,"radiusKm":35.0,"region":"Djerba","country":"Tunisia"}'
```

The marker changes from red to amber with a dashed zone border.

**Step 4 — Delete an alert (marker disappears instantly)**

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/alerts/7" -Method DELETE
```

The marker vanishes from the map without any refresh.

#### Temporal Replay

Test the API directly:

```bash
curl http://localhost:8081/api/alerts/replay/1
```

This returns 5 snapshots showing how the Tunis Floods evolved:
- `08:30` — MEDIUM severity, 5km radius, 12 reports
- `12:00` — HIGH severity, 8km radius, 45 reports
- `18:00` — HIGH severity, 12km radius, 120 reports
- `06:00 next day` — CRITICAL severity, 15km radius, 245 reports
- `18:00 next day` — CRITICAL severity, 15km radius, 280 reports

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                   Angular Frontend                    │
│                                                       │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐ │
│  │ SLA     │ │ Compare  │ │ Rules  │ │ Data       │ │
│  │ Page    │ │ Page     │ │ Page   │ │ Quality    │ │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └─────┬──────┘ │
│       │           │           │             │         │
│  ┌────┴───────────┴───────────┴─────────────┴──────┐ │
│  │              AlertService (HTTP + extract)       │ │
│  └─────────────────────┬───────────────────────────┘ │
│                        │                              │
│  ┌─────────────────────┴───────────────────────────┐ │
│  │          WebSocketService (STOMP/SockJS)         │ │
│  └─────────────────────┬───────────────────────────┘ │
└────────────────────────┼──────────────────────────────┘
                         │ HTTP + WebSocket
┌────────────────────────┼──────────────────────────────┐
│                Spring Boot Backend                     │
│                        │                               │
│  ┌─────────────────────┴───────────────────────────┐  │
│  │ Controllers: SLA, Rules, Compare, Quality,      │  │
│  │              RiskZone, Replay, Alert             │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        │                               │
│  ┌─────────────────────┴───────────────────────────┐  │
│  │ Services: SlaService, RuleEngineService,        │  │
│  │ DataQualityService, RiskZoneService,            │  │
│  │ AlertNotificationService (WebSocket push)       │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        │                               │
│  ┌─────────────────────┴───────────────────────────┐  │
│  │ JPA Repositories + MySQL                        │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```
