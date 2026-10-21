# 🛡️ MediTrust Healthcare — 3-Cloud Zero-Trust Platform

> **Overview**: MediTrust Healthcare is a multi-cloud Electronic Health Records (EHR) & Healthcare management system implementing cryptographic **Mutual TLS (mTLS)**, **Role & Attribute-Based Access Control (RBAC/ABAC)**, immutable security audit logging, emergency Break-Glass overrides, and real-time operational visualizers.

---

## 🏛️ Architecture Overview: 3-Cloud Zero-Trust Simulation

The backend architecture is partitioned into **3 isolated cloud microservices**, simulating a real-world multi-cloud enterprise ecosystem across **AWS**, **GCP**, and **Azure**:

```
                                  ┌───────────────────────────┐
                                  │   React Web Frontend      │
                                  │      (Port 3000)          │
                                  └─────────────┬─────────────┘
                                                │ REST / JWT
                                                ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ ☁️ CLOUD A (AWS Gateway & Identity - Port 5001)                                         │
  │ - Authenticates Users, Issues JWTs, Enforces RBAC/ABAC                                  │
  │ - Acts as client presenting X.509 Certificate (CN: cloud-a-auth)                      │
  └───────────────────────────┬────────────────────────────────┬───────────────────────────┘
                              │                                │
          🔒 mTLS (Cert A ↔ B) │                                │ 🔒 mTLS (Cert A ↔ C)
          (Client Auth Enforced)│                                │ (Client Auth Enforced)
                              ▼                                ▼
  ┌───────────────────────────────────────────┐    ┌───────────────────────────────────────────┐
  │ ☁️ CLOUD B (GCP Patient & EHR - Port 5002) │    │ ☁️ CLOUD C (Azure Appointments & Audit)   │
  │ - Strict mTLS server with Root CA         │◀──▶│ - Port 5003                               │
  │ - Stores EHR, Vitals, Prescriptions,      │mTLS│ - Stores Appointments & System Audit      │
  │   Lab Reports & Emergency Overrides       │    │   Logs with crypto signatures             │
  └───────────────────────────────────────────┘    └───────────────────────────────────────────┘
```

---

## 📦 Key Components Built & Implemented

### 1. 🔒 Security & Cryptography Infrastructure
📁 Link: [`backend/certs/generateCerts.js`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/backend/certs/generateCerts.js)

* **Private Root Certificate Authority (CA)**: Built in Node.js using `node-forge` to generate 2048-bit RSA keys (`ca.crt`, `ca.key`).
* **X.509 Certificates**: Signed certificates issued for each distinct cloud provider node:
  * `cloudA.crt` / `cloudA.key` (AWS Identity Gateway Client Cert)
  * `cloudB.crt` / `cloudB.key` (GCP EHR TLS Server Cert)
  * `cloudC.crt` / `cloudC.key` (Azure Appointments TLS Server Cert)
* **Mutual TLS (mTLS)**: Cloud A connects to Cloud B and Cloud C via HTTPS using a custom Node.js `https.Agent` with `rejectUnauthorized: true` and CA verification. Direct unauthenticated or non-cert calls to Cloud B or Cloud C are strictly rejected with `403 Forbidden`.

---

### 2. ⚡ Backend Microservices
📁 Link: [`backend/services`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/backend/services)

* **Cloud A: AWS Identity & Gateway Service (Port 5001)**
  * 📄 Source: [`cloudA_auth/server.js`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/backend/services/cloudA_auth/server.js)
  * User authentication with preset logins (Admin, Doctor, Patient).
  * JWT generation, validation, and token lifecycle management.
  * Secure mTLS reverse-proxying of API requests to Cloud B & C.
  * Attribute-Based Access Control (**ABAC**), verifying doctor-patient assignments, self-access limits, and emergency Break-Glass authorization.

* **Cloud B: GCP EHR & Patient Data Service (Port 5002)**
  * 📄 Source: [`cloudB_ehr/server.js`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/backend/services/cloudB_ehr/server.js) | Data Store: [`cloudB_ehr/store.js`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/backend/services/cloudB_ehr/store.js)
  * Enforces `requestCert: true` on HTTPS server setup.
  * Manages Electronic Health Records (**EHR**): diagnoses, medical histories, vital signs (heart rate, blood pressure, oxygen), prescriptions, lab results, and Break-Glass emergency override permissions.

* **Cloud C: Azure Appointments & Audit Logging Service (Port 5003)**
  * 📄 Source: [`cloudC_appointments/server.js`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/backend/services/cloudC_appointments/server.js) | Data Store: [`cloudC_appointments/store.js`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/backend/services/cloudC_appointments/store.js)
  * Enforces strict mTLS client certificate validation.
  * Manages appointment scheduling, updates, and cancellations.
  * Maintains immutable system-wide audit log trails capturing access events, mTLS handshake statuses, and Break-Glass activities.

---

### 3. 💻 Modern React Frontend & Role-Based Portals
📁 Link: [`frontend/src`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/frontend/src)

* **Zero-Trust Visualizer Component**
  * 📄 Link: [`ZeroTrustVisualizer.jsx`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/frontend/src/components/ZeroTrustVisualizer.jsx)
  * Interactive 3D/animated topology view displaying real-time mTLS handshake status between Cloud A, B, and C with live mesh health telemetry and simulation toggles.

* **Doctor Portal**
  * 📄 Link: [`DoctorPortal.jsx`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/frontend/src/components/DoctorPortal.jsx)
  * Patient search & medical chart access, adding diagnoses, prescriptions, and lab results.
  * **Break-Glass Emergency Override**: Enables emergency access for unassigned patient records with automatic audit logging.

* **Patient Portal**
  * 📄 Link: [`PatientPortal.jsx`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/frontend/src/components/PatientPortal.jsx)
  * View medical records, lab reports, prescriptions, and vitals.
  * Schedule appointments with assigned doctors.

* **Admin Portal**
  * 📄 Link: [`AdminPortal.jsx`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/frontend/src/components/AdminPortal.jsx)
  * System health metrics, active cloud service status badges, and live security audit log streams.

* **Landing Page & Role Switcher**
  * 📄 Link: [`LandingPage.jsx`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/frontend/src/components/LandingPage.jsx)
  * Quick-access demo authentication interface pre-configured with System Admin, Doctor, and Patient roles.

---

### 4. 🐳 Containerization & Deployment Readiness

* **Docker Compose Setup**
  * 📄 Link: [`docker-compose.yml`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/docker-compose.yml)
  * Multi-container orchestration for `cloud_a_auth`, `cloud_b_ehr`, `cloud_c_appointments`, and `frontend`.
  * Read-only volume mounting for X.509 certificates across container network isolation boundaries.

* **Deployment Documentation**
  * 📄 Link: [`DEPLOYMENT.md`](file:///c:/Users/adity/OneDrive/Desktop/healthcare_system_2/DEPLOYMENT.md)
  * Step-by-step guides for running locally or deploying to **AWS App Runner / ECS**, **GCP Cloud Run**, and **Azure App Service** without code changes.

---

## 🚀 System Summary Matrix

| Service / Component | Network Port | Security Protocol | Operational Status |
| :--- | :--- | :--- | :--- |
| **Certificate CA Generator** | N/A | 2048-bit RSA PKI | ✅ Complete |
| **Cloud A (AWS Gateway)** | `5001` | JWT + mTLS Client | ✅ Operational |
| **Cloud B (GCP EHR)** | `5002` | mTLS Server (`requestCert`) | ✅ Operational |
| **Cloud C (Azure Appointments)** | `5003` | mTLS Server (`requestCert`) | ✅ Operational |
| **React Dashboard & Portals** | `3000` | HTTPS / REST / JWT | ✅ Operational |
| **Docker Compose Mesh** | N/A | Container Network Mesh | ✅ Configured |

---
*Created on 2026-10-07 for MediTrust Healthcare Platform.*
