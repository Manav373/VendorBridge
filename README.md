<div align="center">

<img src="https://img.shields.io/badge/VendorBridge-ERP-6C63FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkPSJNMTMgMkw0LjA5MyAxMy4yNjhIMTJsLTEgOC43MzIgOC45MDctMTEuMjY4SDEybDEtOC43MzJ6Ii8+PC9zdmc+" alt="VendorBridge"/>

# 🌉 VendorBridge

### AI-Powered Vendor & Procurement Management ERP

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com)
[![Groq AI](https://img.shields.io/badge/Groq-LLaMA%203.3%2070B-F55036?style=flat-square&logo=meta&logoColor=white)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**VendorBridge** is a full-stack, production-ready ERP system designed to streamline vendor onboarding, procurement workflows, and quotation management — with Groq-powered AI at its core for intelligent quotation analysis and vendor recommendations.

[🚀 Features](#-features) · [🏗 Architecture](#-architecture) · [⚡ Quick Start](#-quick-start) · [📡 API Reference](#-api-reference) · [🔐 Security](#-security)

</div>

---

## 📸 Screenshots

> Built in 8 hours at a hackathon — **VendorBridge** demonstrates enterprise-grade procurement workflows with AI superpowers.

| Dashboard | Vendor Management | AI Quotation Analysis |
|-----------|------------------|-----------------------|
| Real-time KPIs & analytics | Full vendor lifecycle | LLaMA 3.3 70B insights |
| Purchase order tracking | Onboarding & approval | Risk & savings detection |
| Activity audit logs | Performance metrics | Smart recommendations |

---

## ✨ Features

### 🏢 Vendor Management
- **Vendor Onboarding** — Register, verify, and manage vendor profiles with detailed company info
- **Vendor Performance Tracking** — Monitor reliability, delivery scores, and payment history
- **Status Management** — Active, pending, suspended, and blacklisted vendor states
- **Multi-category Support** — Classify vendors by product/service categories

### 📋 Procurement Workflow
- **RFQ (Request for Quotation)** — Create and distribute RFQs to multiple vendors simultaneously
- **Quotation Management** — Collect, compare, and analyze vendor quotations in one place
- **Purchase Orders** — Generate POs from approved quotations with one click
- **Approval Workflows** — Multi-level approval chains for POs and RFQs
- **Invoice Management** — Track invoices against POs with payment status monitoring

### 🤖 AI-Powered Intelligence (Groq + LLaMA 3.3 70B)
- **AI Quotation Analysis** — Automatically evaluate quotations for pricing fairness, risks, and savings opportunities
- **Vendor Recommendations** — AI-driven vendor scoring and selection suggestions
- **Procurement Insights** — Intelligent spend analysis and optimization recommendations
- **Natural Language Summaries** — Human-readable AI reports on complex procurement data

### 📊 Analytics & Reporting
- **Interactive Dashboard** — Real-time KPIs, spend trends, and performance metrics
- **Custom Reports** — Vendor performance, spend analysis, and procurement efficiency reports
- **Activity Audit Logs** — Complete audit trail of all system actions
- **PDF Export** — Download any report or PO as a formatted PDF

### 🔐 Security & Authentication
- **JWT Authentication** — Access + refresh token rotation
- **Role-Based Access Control (RBAC)** — Admin, Manager, Buyer roles
- **OTP Email Verification** — Two-factor for sensitive operations
- **Password Reset Flow** — Secure tokenized email-based reset
- **Rate Limiting** — Brute-force protection on all auth endpoints
- **Helmet.js** — HTTP security headers out of the box

---

## 🏗 Architecture

```
VendorBridge/
├── 📁 backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/              # DB, env, logger configuration
│   │   ├── controllers/         # Route handler logic
│   │   ├── middleware/          # Auth, upload, error handling
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic layer
│   │   └── utils/               # Helpers & utilities
│   ├── migrations/              # SQL migration files
│   ├── uploads/                 # User-uploaded files (gitignored)
│   ├── .env.example             # Environment variable template ✅
│   └── server.js                # Express app entry point
│
└── 📁 vendorbridge/             # React 19 + TypeScript frontend
    ├── src/
    │   ├── components/          # Reusable UI components
    │   │   └── ui/              # AI & specialized widgets
    │   ├── context/             # React context (AuthContext)
    │   ├── hooks/               # Custom React hooks
    │   ├── layouts/             # Page layout wrappers
    │   ├── pages/               # Route-level page components
    │   ├── routes/              # React Router configuration
    │   ├── services/            # Axios API service layer
    │   └── utils/               # Frontend utilities
    └── vite.config.ts           # Vite build configuration
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Radix UI |
| **Backend** | Node.js 18+, Express.js, Winston logging |
| **Database** | PostgreSQL (via Supabase) |
| **AI** | Groq Cloud — LLaMA 3.3 70B Versatile |
| **Auth** | JWT (RS256), bcryptjs, OTP via Nodemailer |
| **Charts** | Recharts |
| **PDF** | jsPDF + html2canvas |
| **Validation** | Joi (backend), Zod + React Hook Form (frontend) |
| **File Upload** | Multer (multipart/form-data) |

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** database (local or [Supabase](https://supabase.com) — free tier works)
- **Groq API Key** — [Get one free at console.groq.com](https://console.groq.com/keys)
- **Gmail App Password** — [Enable 2FA → App Passwords](https://myaccount.google.com/apppasswords)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Manav373/VendorBridge.git
cd VendorBridge
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# → Open .env and fill in your values (see Environment Variables section)

# Run database migrations
npm run migrate

# (Optional) Seed sample data
npm run seed

# Start development server
npm run dev
```

> The backend will start on **http://localhost:5000**
> Health check: **http://localhost:5000/health**

---

### 3. Frontend Setup

```bash
cd ../vendorbridge

# Install dependencies
npm install

# Start development server
npm run dev
```

> The frontend will start on **http://localhost:5173**

---

## 🔐 Environment Variables

Create `backend/.env` from the template:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port (default: `5000`) | ✅ |
| `NODE_ENV` | `development` or `production` | ✅ |
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler URL) | ✅ |
| `JWT_SECRET` | ≥32-char secret for access tokens | ✅ |
| `JWT_REFRESH_SECRET` | ≥32-char secret for refresh tokens | ✅ |
| `JWT_ACCESS_EXPIRY` | Access token TTL (default: `15m`) | ✅ |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (default: `7d`) | ✅ |
| `MAIL_USER` | Gmail address for sending emails | ✅ |
| `MAIL_PASS` | Gmail App Password (16 chars, no spaces) | ✅ |
| `MAIL_FROM` | Sender display name and email | ✅ |
| `GROQ_API_KEY` | Groq Cloud API key | ✅ |
| `GROQ_MODEL` | Model ID (default: `llama-3.3-70b-versatile`) | ✅ |
| `CLIENT_URL` | Frontend origin for CORS (default: `http://localhost:5173`) | ✅ |
| `UPLOAD_DIR` | File upload directory (default: `./uploads`) | ⚙️ |
| `MAX_FILE_SIZE` | Max upload size in bytes (default: `10485760` = 10MB) | ⚙️ |

> **🔑 Generate secure JWT secrets:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

> **⚠️ Security Notice:** Never commit your `.env` file. It is listed in `.gitignore` and excluded from the repository.

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Invalidate refresh token |
| `POST` | `/auth/forgot-password` | Send OTP to email |
| `POST` | `/auth/verify-otp` | Verify OTP code |
| `POST` | `/auth/reset-password` | Set new password |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/vendors` | List all vendors (paginated) |
| `POST` | `/vendors` | Create a new vendor |
| `GET` | `/vendors/:id` | Get vendor details |
| `PUT` | `/vendors/:id` | Update vendor |
| `DELETE` | `/vendors/:id` | Delete vendor |
| `PATCH` | `/vendors/:id/status` | Update vendor status |

### RFQs (Request for Quotation)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rfqs` | List all RFQs |
| `POST` | `/rfqs` | Create new RFQ |
| `GET` | `/rfqs/:id` | Get RFQ details |
| `PUT` | `/rfqs/:id` | Update RFQ |
| `POST` | `/rfqs/:id/send` | Send RFQ to vendors |

### Quotations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/quotations` | List all quotations |
| `POST` | `/quotations` | Submit a quotation |
| `GET` | `/quotations/:id` | Get quotation details |
| `POST` | `/quotations/:id/analyze` | 🤖 AI analyze quotation |
| `GET` | `/quotations/compare/:rfqId` | Compare quotations for an RFQ |

### Purchase Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/purchase-orders` | List all POs |
| `POST` | `/purchase-orders` | Create PO from quotation |
| `GET` | `/purchase-orders/:id` | Get PO details |
| `PATCH` | `/purchase-orders/:id/status` | Update PO status |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/analyze-quotations` | Analyze multiple quotations |
| `POST` | `/ai/vendor-recommendations` | Get vendor recommendations |
| `POST` | `/ai/procurement-insights` | Generate spend insights |

### Other Modules

- `/approvals` — Approval workflow management
- `/invoices` — Invoice tracking
- `/reports` — Analytics & report generation
- `/activity-logs` — System audit trail
- `/users` — User management (Admin)

---

## 🛡 Security

VendorBridge implements multiple layers of security:

- **🔒 JWT Rotation** — Short-lived access tokens (15min) + refresh token rotation
- **🛡 Helmet.js** — Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **🚦 Rate Limiting** — 10 attempts/15min on auth endpoints, 200 req/15min globally
- **🔑 bcryptjs** — Password hashing with salt rounds
- **📧 OTP Verification** — Time-limited OTPs (15 min) for sensitive operations
- **🌐 CORS** — Strict origin whitelisting in production
- **📁 Input Validation** — Joi schemas on all API inputs
- **🗃 Parameterized Queries** — No raw SQL concatenation; prevents SQL injection
- **📤 Secure File Upload** — MIME type + extension validation via Multer

### Reporting Vulnerabilities

Please report security vulnerabilities privately to the maintainers. Do not open public issues for security concerns.

---

## 🗃 Database Schema

VendorBridge uses the following core tables:

```
users          → Authentication & RBAC
vendors        → Vendor profiles & metadata
rfqs           → Request for Quotation records
rfq_items      → Line items within RFQs
quotations     → Vendor-submitted quotations
quotation_items → Quotation line items
purchase_orders → Generated POs
po_items       → PO line items
invoices       → Invoice records against POs
approvals      → Approval workflow instances
activity_logs  → Full audit trail
```

Run migrations to create the schema:
```bash
cd backend && npm run migrate
```

---

## 🚀 Deployment

### Environment Setup for Production

1. Set `NODE_ENV=production` in your `.env`
2. Use a strong `JWT_SECRET` (≥64 hex chars)
3. Set `CLIENT_URL` to your actual frontend domain
4. Enable `DB_SSL=true` for database connections
5. Configure proper SMTP credentials

### Build Frontend for Production

```bash
cd vendorbridge
npm run build
# Output in vendorbridge/dist/
```

### Deploy Backend

The backend is a standard Node.js Express app — deployable to:
- **Railway** / **Render** / **Fly.io** — `npm start`
- **Docker** — Containerize with the included Express server
- **VPS** — Use PM2 for process management

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows the existing patterns and includes appropriate error handling.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---


<div align="center">

**⭐ If VendorBridge saved you time, give it a star! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/Manav373/VendorBridge?style=social)](https://github.com/Manav373/VendorBridge/stargazers)

Made with ☕ + 🤖 AI + a lot of caffeine

</div>
