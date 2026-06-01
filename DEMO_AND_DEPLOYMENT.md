# IOMS: Screen Recording Demo Script & Deployment Guide

This document contains a suggested script for your screen recording demonstration and the detailed, step-by-step commands needed for production deployment.

---

## Part 1: Screen Recording Demo Script

**[Screen showing the Dashboard Page]**

**Speaker:**
> "Hello everyone! Today I’m excited to walk you through IOMS — the Intelligent Inventory & Order Management System. IOMS is a production-grade, full-stack SaaS platform designed to streamline business operations."
> 
> "As you can see on the Dashboard, we have a clean, dark-themed UI built with React 18, Vite, and Tailwind CSS. The dashboard gives us real-time insights: Total Products, Customers, Orders, and critical Low Stock Alerts. Below, we have dynamic charts powered by Recharts showing inventory levels and order statuses."

**[Click on the 'Products' tab in the sidebar]**

**Speaker:**
> "Let's head over to the Products section. This data table supports search and sorting. Let's add a new product."
> *[Click 'Add Product', fill out the form: Name="Wireless Mouse", SKU="WM-001", Price="25", Quantity="50"]*
> "Our forms are protected by Zod validation schemas. Notice that SKUs must be unique, and quantities cannot be negative. Once I hit create, the table updates instantly using TanStack Query, and we get a success notification."

**[Click on the 'Customers' tab]**

**Speaker:**
> "Moving to Customers, we have similar robust CRUD functionality. Email uniqueness is strictly enforced by the backend."
> *[Optional: Briefly click 'Add Customer', type a name and email, and save]*

**[Click on the 'Orders' tab]**

**Speaker:**
> "The core of IOMS is the Orders system. Let's create a new order."
> *[Click 'New Order'. Select the customer you just created]*
> "The order creation wizard allows us to dynamically add multiple products. As I adjust the quantities, notice the Estimated Total calculating in real-time."
> *[Select the 'Wireless Mouse', set quantity to 2, click 'Place Order']*
> "When I place this order, something crucial happens behind the scenes. The FastAPI backend wraps the order creation and inventory deduction in a single, atomic database transaction using an exclusive row lock (`SELECT ... FOR UPDATE`). This guarantees that even under high concurrency, we never oversell our stock. If we don't have enough stock, the entire transaction rolls back."

**[Click back to the 'Dashboard' tab]**

**Speaker:**
> "Back on the dashboard, our metrics and charts have automatically updated to reflect the new revenue and lowered stock."
>
> "Under the hood, the backend is powered by Python 3.12, FastAPI, and asynchronous SQLAlchemy 2.0. The entire monorepo is fully Dockerized, backed by a CI/CD pipeline using GitHub Actions, and ready for production deployment."
>
> "Thank you for watching!"

---

## Part 2: Detailed Deployment Guide

This guide covers deploying the application using modern, free-tier friendly platforms: **Render** (for the database and backend) and **Vercel** (for the frontend).

### Step 1: Push Code to GitHub
If you haven't already, push your code to your GitHub repository.
```bash
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

### Step 2: Provision a PostgreSQL Database (Render)
1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** > **PostgreSQL**.
2. Name the database (e.g., `ioms-db`).
3. Select the free tier and click **Create Database**.
4. Once created, copy the **Internal Database URL** (for the backend connecting on Render) and the **External Database URL** (for running migrations locally if needed).
   - *Note: Change `postgres://` to `postgresql+asyncpg://` when using the URL in the backend.*

### Step 3: Deploy the Backend API (Render)
1. In Render, click **New +** > **Web Service**.
2. Connect your GitHub repository (`piyushb03/IOMS`).
3. Render will automatically detect the `render.yaml` file in the project root and configure the service (Build Command, Start Command, Python version).
4. In the Render setup screen, add the following **Environment Variables**:
   - `DATABASE_URL` = *(Paste the modified Render Database URL from Step 2, ensuring it starts with `postgresql+asyncpg://`)*
   - `SECRET_KEY` = *(Run `openssl rand -hex 32` in your terminal and paste the result here, or just type a long random string)*
   - `ENVIRONMENT` = `production`
   - `FRONTEND_URL` = `https://your-frontend-url.vercel.app` *(You can leave this blank for now and update it after Step 4)*
5. Click **Create Web Service**.

### Step 4: Run Production Database Migrations
Before the backend can work, it needs the database tables.
1. In your Render Dashboard, click on your newly deployed Backend Web Service.
2. Go to the **Shell** tab on the left sidebar.
3. Run the Alembic migration command:
```bash
alembic upgrade head
```
*You should see output confirming that the tables (`products`, `customers`, `orders`, `order_items`) were created successfully.*

### Step 5: Deploy the Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com/dashboard) and click **Add New...** > **Project**.
2. Import the `IOMS` repository from your GitHub.
3. In the Configuration screen:
   - Expand the **Framework Preset** and ensure it says **Vite**.
   - Change the **Root Directory** to `frontend`.
4. Expand the **Environment Variables** section and add:
   - Name: `VITE_API_URL`
   - Value: *(Your Render backend URL, e.g., `https://ioms-backend.onrender.com`)*
5. Click **Deploy**. Vercel will build the React app and give you a live URL (e.g., `https://ioms.vercel.app`).

### Step 6: Finalize Configuration
1. Copy the Vercel URL you just generated.
2. Go back to Render > your Backend Web Service > **Environment**.
3. Update or add the `FRONTEND_URL` variable with your Vercel URL (this configures secure CORS policies).
4. Restart your Render backend service.

---

## Alternative: Self-Hosted Docker Deployment
If you prefer to host everything yourself on a VPS (like AWS EC2 or DigitalOcean):

1. SSH into your server.
2. Clone the repository:
```bash
git clone https://github.com/piyushb03/IOMS.git
cd IOMS
```
3. Set up environment variables:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
*(Edit the `.env` files to change passwords and set the `VITE_API_URL` to your server's domain/IP).*
4. Start the Docker services:
```bash
docker compose up -d --build
```
5. Run the initial database migrations:
```bash
docker compose exec backend alembic upgrade head
```
Your app will now be running on port `80` (Frontend) and port `8000` (Backend API).
