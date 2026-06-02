# IOMS — Inventory & Order Management System

> A production-grade, SaaS-style platform for managing products, customers, orders, and business insights. Built as a full-stack monorepo with FastAPI, React 18, PostgreSQL, and Docker.


![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

---

## 📸 Screenshots

<details>
<summary><b>Click to expand screenshots</b></summary>

### Dashboard
![Dashboard](<img width="1919" height="1074" alt="image" src="https://github.com/user-attachments/assets/b5af873b-25df-4791-9c68-b4cdd28da796" />
)

### Products Page
![Products](<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/e2cfdfe1-fb11-4b4a-8e81-b4a9e3f4dc9d" />
)

### Add New Product
![Add Product](<img width="1887" height="861" alt="image" src="https://github.com/user-attachments/assets/6584cc37-f8ba-4b29-9cc6-8c3d1c2c23ba" />
)

### Customer
![Customer](<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/0420eb4a-dd26-4fe4-ae33-f610dfd8bc65" />
)

</details>

---

## Features

| Category | Features |
|---|---|
| **Products** | Create, Read, Update, Delete · Unique SKU enforcement · Pagination · Search · Sort |
| **Customers** | Create, Read, Delete · Unique email enforcement · Search · Pagination |
| **Orders** | Atomic order creation · Stock validation · Auto inventory deduction · Order history · Detail modal |
| **Dashboard** | Live metrics · Inventory bar chart · Order status pie chart · Low stock alerts |
| **API** | RESTful · Standardised response envelopes · Structured error messages |
| **DevOps** | Docker Compose · Multi-stage Dockerfiles · GitHub Actions CI · Render + Vercel deploy |

---

## Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (Vercel)"]
        UI["React 18 + Vite"]
        TQ["TanStack Query"]
        RHF["React Hook Form + Zod"]
    end

    subgraph Backend["Backend (Render)"]
        API["FastAPI"]
        SVC["Services Layer"]
        ORM["SQLAlchemy 2.0"]
    end

    subgraph Database["Database (Render PostgreSQL)"]
        PG["PostgreSQL 16"]
    end

    UI --> TQ
    TQ -->|Axios| API
    RHF --> TQ
    API --> SVC
    SVC --> ORM
    ORM --> PG
```

---

## Folder Structure

```
IOMS/
├── backend/
│   ├── alembic/                    # Database migrations
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── app/
│   │   ├── api/v1/                 # Route handlers
│   │   │   ├── products.py
│   │   │   ├── customers.py
│   │   │   ├── orders.py
│   │   │   └── dashboard.py
│   │   ├── core/                   # Config, logging, security
│   │   │   ├── config.py
│   │   │   ├── logging.py
│   │   │   └── security.py
│   │   ├── db/                     # Database engine & session
│   │   │   └── database.py
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── product.py
│   │   │   ├── customer.py
│   │   │   ├── order.py
│   │   │   └── order_item.py
│   │   ├── schemas/                # Pydantic v2 schemas
│   │   │   ├── product.py
│   │   │   ├── customer.py
│   │   │   └── order.py
│   │   ├── services/               # Business logic
│   │   │   ├── product_service.py
│   │   │   ├── customer_service.py
│   │   │   ├── order_service.py
│   │   │   └── dashboard_service.py
│   │   └── main.py                 # FastAPI application entry point
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_products.py
│   │   ├── test_customers.py
│   │   └── test_orders.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # Axios API modules
│   │   ├── components/
│   │   │   ├── layout/             # AppLayout, Sidebar, Header
│   │   │   ├── shared/             # StatsCard, EmptyState, ConfirmDialog, PageHeader
│   │   │   └── ui/                 # Button, Card, Dialog, Select, Badge, Toast...
│   │   ├── hooks/                  # TanStack Query hooks
│   │   ├── lib/                    # utils.js
│   │   ├── pages/                  # Dashboard, Products, Customers, Orders, NotFound
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker-compose.yml
├── render.yaml
├── vercel.json
└── README.md
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.12 | Runtime |
| FastAPI | 0.115 | Web framework |
| SQLAlchemy | 2.0 | ORM (async) |
| Alembic | 1.13 | Database migrations |
| Pydantic | v2 | Validation & serialisation |
| asyncpg | 0.30 | PostgreSQL async driver |
| Uvicorn | 0.30 | ASGI server |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI library |
| Vite | 5 | Build tool |
| React Router DOM | 6 | Client-side routing |
| TanStack Query | 5 | Data fetching & caching |
| Axios | 1.7 | HTTP client |
| React Hook Form | 7 | Form management |
| Zod | 3 | Schema validation |
| TailwindCSS | 3 | Utility-first CSS |
| Radix UI | latest | Accessible UI primitives |
| Recharts | 2 | Data visualisation |
| Lucide React | latest | Icons |

---

## Database Schema

```mermaid
erDiagram
    PRODUCTS {
        string id PK
        string name
        string sku UK
        decimal price
        int quantity
        datetime created_at
        datetime updated_at
    }
    CUSTOMERS {
        string id PK
        string full_name
        string email UK
        string phone
        datetime created_at
    }
    ORDERS {
        string id PK
        string customer_id FK
        decimal total_amount
        string status
        datetime created_at
    }
    ORDER_ITEMS {
        string id PK
        string order_id FK
        string product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    CUSTOMERS ||--o{ ORDERS : "places"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "included in"
```

---

## API Documentation

All responses follow this envelope:

```json
// Success
{ "success": true, "message": "Operation successful", "data": {} }

// Error
{ "success": false, "message": "Validation failed" }
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/dashboard/summary` | Dashboard metrics |
| `POST` | `/api/v1/products` | Create product |
| `GET` | `/api/v1/products` | List products (page, limit, search, sort) |
| `GET` | `/api/v1/products/{id}` | Get product |
| `PUT` | `/api/v1/products/{id}` | Update product |
| `DELETE` | `/api/v1/products/{id}` | Delete product |
| `POST` | `/api/v1/customers` | Create customer |
| `GET` | `/api/v1/customers` | List customers |
| `GET` | `/api/v1/customers/{id}` | Get customer |
| `DELETE` | `/api/v1/customers/{id}` | Delete customer |
| `POST` | `/api/v1/orders` | Create order (atomic) |
| `GET` | `/api/v1/orders` | List orders |
| `GET` | `/api/v1/orders/{id}` | Get order |
| `DELETE` | `/api/v1/orders/{id}` | Delete order |

### Create Order

```json
POST /api/v1/orders
{
  "customer_id": "uuid-of-customer",
  "items": [
    { "product_id": "uuid-of-product", "quantity": 2 }
  ]
}
```

The backend validates stock, calculates totals, creates the order, and reduces inventory — all in a single atomic database transaction.

---

## Docker Setup

### Prerequisites
- Docker Desktop installed and running

### Start all services

```bash
# Clone the repository
git clone https://github.com/piyushb03/IOMS.git
cd IOMS

# Copy environment example
cp backend/.env.example backend/.env

# Start everything
docker compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

### Run database migrations (first time)

```bash
docker compose exec backend alembic upgrade head
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql+asyncpg://user:pass@host:5432/db` |
| `APP_NAME` | Application name | `IOMS` |
| `ENVIRONMENT` | Runtime environment | `development` / `production` |
| `SECRET_KEY` | Secret key for signing | `your-secret-key` |
| `FRONTEND_URL` | Frontend origin for CORS | `https://your-app.vercel.app` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `https://ioms-backend.onrender.com` |

---

## Local Development (Without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set DATABASE_URL to your local PostgreSQL
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

Tests use an in-memory SQLite database — no external database required.

---

## Deployment

### Backend → Render

1. Push this repository to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo
4. Render will detect `render.yaml` and configure automatically
5. Add environment variables in the Render dashboard:
   - `DATABASE_URL` (from Render PostgreSQL)
   - `FRONTEND_URL`
   - `SECRET_KEY`

### Frontend → Vercel

1. Import the repository on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` → your Render backend URL
4. Deploy — Vercel detects Vite automatically

### Run migrations on Render

After first deploy, open the Render shell and run:
```bash
alembic upgrade head
```

---

## GitHub Actions CI

The pipeline runs on every push and pull request:

```
Backend CI:
  ✓ Install Python dependencies
  ✓ Ruff lint check
  ✓ Black format check
  ✓ Pytest (SQLite in-memory)

Frontend CI:
  ✓ Install Node dependencies
  ✓ ESLint check
  ✓ Vite production build
  ✓ Upload build artifact (main branch only)
```

---

## Business Rules

1. SKU must be unique per product
2. Customer email must be unique
3. Product price cannot be negative
4. Product quantity cannot be negative
5. Order item quantity must be > 0
6. Orders cannot be created if stock is insufficient
7. Inventory automatically decreases after successful order creation
8. Order totals are calculated server-side only (never trusted from client)
9. All order creation runs in a single atomic database transaction
10. Entire transaction rolls back on any failure

---

