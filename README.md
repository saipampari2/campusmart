# CampusMart

CampusMart is a full-stack campus marketplace where students can browse and buy second-hand books, electronics, cycles, and hostel essentials. Sellers can publish listings and manage order progress. The project includes a React web app and a Django REST API.

## Features

- Browse listings and view listing details.
- Register and sign in as a student or seller.
- Filter listings by category and other listing attributes.
- Add listings to a personal cart and place orders.
- View and cancel eligible orders.
- Manage seller listings and advance order statuses.
- Authenticate API requests with JWT access and refresh tokens.
- Load demo accounts, listings, and optional sample orders with a Django command.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 18, React Router, Vite |
| Backend | Python, Django, Django REST Framework |
| Authentication | Simple JWT |
| Database | SQLite (development default) |
| Deployment | Vercel (frontend), Render (backend API) |

## Project structure

```text
campusmart-fullstack/
├── README.md
├── render.yaml                  # Render backend API (free demo setup)
├── .env.example                 # Local backend environment variable template
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3                 # Local development database (created/used by Django)
│   ├── config/                    # Django settings, root URLs, pagination, permissions
│   ├── users/                     # User model, registration, login, logout, token refresh
│   ├── listings/                  # Marketplace listings, filters, visibility, seed command
│   ├── cart/                      # User carts and cart items
│   ├── orders/                    # Orders, order items, checkout and cancellation
│   └── seller/                    # Seller listings, dashboard, and order management
└── frontend/
    ├── vercel.json              # Vercel SPA route fallback
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── api.js                 # API requests and JWT token handling
        ├── App.jsx                # Routes and shared navigation
        ├── context.jsx            # Shared app/auth/cart state
        ├── hooks.js               # Shared React hooks
        ├── index.css              # Global styles
        ├── main.jsx               # Frontend entry point
        └── pages/
            ├── Auth.jsx           # Login and registration
            ├── Home.jsx           # Landing page
            ├── Listings.jsx       # Listing catalogue
            ├── ListingDetail.jsx  # Listing detail
            ├── CartCheckout.jsx   # Cart and checkout
            ├── Orders.jsx         # Customer order history and details
            └── Seller.jsx         # Seller dashboard and listing/order tools
```

## Requirements

- Python 3.10 or later
- Node.js and npm

## Run locally

Run the backend and frontend in separate terminals.

### 1. Configure and start the backend

From the project root, create and activate a virtual environment, then install the dependencies:

**Windows PowerShell**

```powershell
cd backend
py -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS/Linux**

```bash
cd backend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
```

Create database migrations, apply them, and load the demo data:

```bash
python manage.py makemigrations users listings cart orders
python manage.py migrate
python manage.py seed_listings --with-orders
```

Start the API server:

```bash
python manage.py runserver 8000
```

The API is available at `http://127.0.0.1:8000/`. Django admin is at `http://127.0.0.1:8000/admin/`.

The seed command creates 54 sample listings, a seller account, and a student account. `--with-orders` also creates sample delivered orders. Demo credentials:

| Username | Password | Role |
| --- | --- | --- |
| `Priya` | `secret123` | Seller |
| `Arjun` | `secret123` | Student |

These credentials and Django's development settings are for local testing only; change them before using the project in a deployed environment.

### 2. Configure and start the frontend

In a second terminal, from the project root:

```bash
cd frontend
npm install
```

The frontend reads its API origin from `VITE_API_BASE_URL`. Create or update `frontend/.env` with:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Then start Vite:

```bash
npm run dev
```

Open `http://localhost:3000`. If you change the `.env` value, restart the Vite development server.

## Deploy frontend to Vercel and backend to Render

The root [render.yaml](./render.yaml) defines only the Django API on Render's Free plan in Singapore. Deploy the React/Vite frontend separately to Vercel.

### Deploy the backend to Render

1. Push the project to GitHub (the current repository is `saipampari2/campusmart`, branch `main`).
2. In Render, choose **New → Blueprint**, connect the repository, and select `main`. Render reads the root `render.yaml` and creates the `campusmart-api` service.
3. Wait for the service to become live and copy its public URL, for example `https://campusmart-api.onrender.com`.

Render installs dependencies from `backend/requirements.txt`, runs the database migrations, and starts Django with Gunicorn. Render generates `DJANGO_SECRET_KEY`. Set `DJANGO_CORS_ALLOWED_ORIGINS` in the Render service environment to the exact Vercel site origin after deploying the frontend. The SQLite database lives on the Free service's ephemeral filesystem. **Database data is lost when the service restarts, spins down, or redeploys**, so this setup is only for demos and testing, not production. Free web services can spin down after 15 minutes without inbound traffic, and the first request after that can take about a minute to start. Do not run the demo seed command on a public deployment, because it creates predictable demo credentials.

### Deploy the frontend to Vercel

1. In Vercel, choose **Add New → Project**, import `saipampari2/campusmart`, and select the `main` branch.
2. Set **Root Directory** to `frontend`.
3. Use the Vite framework preset, build command `npm run build`, and output directory `dist`.
4. Add the environment variable `VITE_API_BASE_URL` with the Render backend URL, with no trailing slash (for example, `https://campusmart-api.onrender.com`).
5. Deploy and copy the generated Vercel URL.
6. In Render's `campusmart-api` **Environment** settings, add `DJANGO_CORS_ALLOWED_ORIGINS` with the exact Vercel origin (for example, `https://campusmart.vercel.app`, without a trailing slash). Save the change and let Render redeploy.
7. Open the Vercel URL and confirm that listing data loads and sign-in works.

The `frontend/vercel.json` rewrite serves the React app entry point on direct navigation to client-side routes. After a frontend update on `main`, Vercel deploys it automatically; Render deploys the backend when its configuration or backend source changes.

## API overview

The API is rooted at `/api/`:

| Endpoint prefix | Purpose |
| --- | --- |
| `/api/users/` | Registration, login, logout, and token refresh |
| `/api/listings/` | Browse, create, and retrieve listings |
| `/api/cart/` | Read and update the signed-in user's cart |
| `/api/orders/` | Create orders, view order details, and cancel eligible orders |
| `/api/seller/` | Seller dashboard, listings, orders, and order status updates |

Most cart, order, and seller operations require signing in. The frontend handles JWT tokens and retries a request after refreshing an expired access token.

## Useful commands

From `frontend/`, create a production frontend build:

```bash
npm run build
```

From `backend/`, run Django's development checks:

```bash
python manage.py check
```
