# ☁️ 3-Cloud Zero-Trust Mutual Authentication Deployment Guide

This guide explains how to run the **Zero-Trust Healthcare System** in **Local 3-Cloud Simulation Mode** today and transition to **Real AWS, GCP, and Azure Clouds** with **zero code modifications**.

---

## 🚀 Part 1: Quick Local Run (Simulation Mode)

### Step 1: Generate X.509 Certificates
Run the certificate generator script to create the Private Root CA and 3 Cloud certificates (`cloudA`, `cloudB`, `cloudC`):

```bash
cd backend/certs
npm install
node generateCerts.js
```

### Step 2: Start Cloud Microservices

Open 3 separate terminals or run in background:

1. **Start Cloud B (GCP Patient & EHR Service on Port 5002 - mTLS Enforced)**:
   ```bash
   cd backend/services/cloudB_ehr
   npm start
   ```

2. **Start Cloud C (Azure Appointments & Audit Service on Port 5003 - mTLS Enforced)**:
   ```bash
   cd backend/services/cloudC_appointments
   npm start
   ```

3. **Start Cloud A (AWS Auth & Identity Gateway Service on Port 5001)**:
   ```bash
   cd backend/services/cloudA_auth
   npm start
   ```

4. **Start Web Frontend Dashboard (Port 3000)**:
   ```bash
   cd frontend
   npm run dev
   ```

Now open **http://localhost:3000** in your web browser.

---

## 🐋 Docker Compose Option (1-Click Launch)

To launch all 3 cloud containers and the frontend with a single command:

```bash
docker-compose up --build
```

---

## 🌐 Part 2: Transitioning to Actual Cloud Hosting (AWS + GCP + Azure)

When you are ready to deploy to real cloud providers, **NO CODE CHANGES ARE NEEDED**. You only deploy the Docker containers and update 3 environment variables (`.env`).

```
                    ┌──────────────────────────────────────────┐
                    │      [ User Web Browser / Vercel ]       │
                    └────────────────────┬─────────────────────┘
                                         │ (HTTPS / TLS 1.3)
                                         ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │ ☁️ CLOUD A (AWS): AWS App Runner / ECS Container                                        │
 │ - Secret Manager stores cloudA.crt & cloudA.key                                         │
 └───────────────────────────┬─────────────────────────────────┬───────────────────────────┘
                             │                                 │
         🔒 Real mTLS        │                                 │ 🔒 Real mTLS
         (Cert A ↔ Server B) │                                 │ (Cert A ↔ Server C)
                             ▼                                 ▼
 ┌────────────────────────────────────────────┐    ┌────────────────────────────────────────────┐
 │ ☁️ CLOUD B (GCP): GCP Cloud Run Container   │    │ ☁️ CLOUD C (AZURE): Azure App Service      │
 │ - GCP Secret Manager stores ca.crt         │◀──▶│ - Azure Key Vault stores ca.crt            │
 └────────────────────────────────────────────┘mTLS└────────────────────────────────────────────┘
```

### 1. Deploy Cloud A to AWS (AWS App Runner or AWS ECS)
1. Push `backend/services/cloudA_auth/Dockerfile` to **AWS Elastic Container Registry (ECR)**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker build -t cloud-a-auth ./backend/services/cloudA_auth
   docker tag cloud-a-auth:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/cloud-a-auth:latest
   docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/cloud-a-auth:latest
   ```
2. Store `cloudA.crt` and `cloudA.key` in **AWS Secrets Manager**.
3. Set Environment Variables in AWS App Runner / ECS:
   - `CLOUD_B_URL`: `https://cloud-b-ehr-gcp.run.app`
   - `CLOUD_C_URL`: `https://cloud-c-appointments-azure.azurewebsites.net`

---

### 2. Deploy Cloud B to GCP (GCP Cloud Run)
1. Push `backend/services/cloudB_ehr/Dockerfile` to **GCP Artifact Registry**:
   ```bash
   gcloud auth configure-docker
   docker build -t gcr.io/<gcp-project-id>/cloud-b-ehr ./backend/services/cloudB_ehr
   docker push gcr.io/<gcp-project-id>/cloud-b-ehr
   ```
2. Store `ca.crt` in **GCP Secret Manager**.
3. Deploy to Cloud Run enforcing client certificate verification (`requestCert: true`).

---

### 3. Deploy Cloud C to Azure (Azure App Service / ACR)
1. Push `backend/services/cloudC_appointments/Dockerfile` to **Azure Container Registry**:
   ```bash
   az acr login --name <my-acr-name>
   docker build -t <my-acr-name>.azurecr.io/cloud-c-appointments ./backend/services/cloudC_appointments
   docker push <my-acr-name>.azurecr.io/cloud-c-appointments
   ```
2. Enable TLS settings in Azure App Service: `Client Certificate Mode: Require`.
3. Store `ca.crt` in **Azure Key Vault**.

---

### 4. Update Frontend Environment Variable
In Vercel / Netlify / AWS Amplify set:
```env
VITE_CLOUD_A_URL=https://cloud-a-auth.us-east-1.awsapprunner.com
```

That's it! Your system is now running live across AWS, GCP, and Azure with Zero-Trust mTLS security!
