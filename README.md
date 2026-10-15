# CampusMart

CampusMart is a full-stack campus marketplace where students can browse and buy second-hand books, electronics, cycles, and hostel essentials. Sellers can publish listings and manage order progress. The project includes a React web app and a Django REST API.

The repository also includes a Docker Compose setup and a Jenkins CI/CD pipeline for building images, publishing them to AWS ECR, and deploying them to an EC2 instance.

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
| Containers and CI/CD | Docker, Docker Compose, Jenkins |
| Deployment target | AWS EC2 with Amazon ECR |

## Project structure

```text
campusmart-fullstack/
├── README.md
├── Jenkinsfile                  # Jenkins build, ECR push, and EC2 deployment pipeline
├── Makefile                     # Local Docker Compose helper commands
├── docker-compose.yml           # Frontend and backend services with persistent SQLite volume
├── render.yaml                  # Render backend API (free demo setup)
├── .env.example                 # Environment variable template; copy to .env and set a secret
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
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
    ├── Dockerfile
    ├── .dockerignore
    ├── vercel.json              # Vercel SPA route fallback
    ├── nginx.conf               # Serves the SPA and proxies API/admin requests
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

## Run with Docker Compose

Install Docker Desktop (Windows/macOS) or Docker Engine with the Compose plugin (Linux). From the project root, create a local environment file and start the containers:

```bash
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env`. Set `DJANGO_SECRET_KEY` in `.env` to a long random value, then run:

```bash
docker compose up --build
```

Open `http://localhost`. The frontend container also proxies `/api/`, `/admin/`, and `/static/` to Django, so the browser uses the same origin for the API. The backend applies migrations and collects static files when it starts. SQLite data persists in the `campusmart-data` Docker volume. To stop the services, run `docker compose down`; the named data volume is retained. **Do not run `docker compose down --volumes` unless you intend to delete that database.**

Equivalent Makefile shortcuts include `make up`, `make down`, `make logs`, `make check`, and `make seed`. `make seed` is for development only; it creates the documented demo accounts and sample data.

## Deploy frontend to Vercel and backend to Render

The root [render.yaml](./render.yaml) defines only the Django API on Render's Free plan in Singapore. Deploy the React/Vite frontend separately to Vercel.

### Deploy the backend to Render

1. Push the project to GitHub (the current repository is `saipampari2/campusmart`, branch `main`).
2. In Render, choose **New → Blueprint**, connect the repository, and select `main`. Render reads the root `render.yaml` and creates the `campusmart-api` service.
3. Wait for the service to become live and copy its public URL, for example `https://campusmart-api.onrender.com`.

Render generates `DJANGO_SECRET_KEY`. The SQLite database lives on the Free service's ephemeral filesystem. **Database data is lost when the service restarts, spins down, or redeploys**, so this setup is only for demos and testing, not production. Free web services can spin down after 15 minutes without inbound traffic, and the first request after that can take about a minute to start. Do not run the demo seed command on a public deployment, because it creates predictable demo credentials.

### Deploy the frontend to Vercel

1. In Vercel, choose **Add New → Project**, import `saipampari2/campusmart`, and select the `main` branch.
2. Set **Root Directory** to `frontend`.
3. Use the Vite framework preset, build command `npm run build`, and output directory `dist`.
4. Add the environment variable `VITE_API_BASE_URL` with the Render backend URL, with no trailing slash (for example, `https://campusmart-api.onrender.com`).
5. Deploy and copy the generated Vercel URL.
6. In Render's `campusmart-api` **Environment** settings, add `DJANGO_CORS_ALLOWED_ORIGINS` with the exact Vercel origin (for example, `https://campusmart.vercel.app`, without a trailing slash). Save the change and let Render redeploy.
7. Open the Vercel URL and confirm that listing data loads and sign-in works.

The `frontend/vercel.json` rewrite serves the React app entry point on direct navigation to client-side routes. After a frontend update on `main`, Vercel deploys it automatically; Render deploys the backend when its configuration or backend source changes.

## Deploy to AWS EC2 with Jenkins CI/CD

The included `Jenkinsfile` implements this pipeline:

1. Validate the EC2 deployment parameters.
2. Build both Docker images and run Django's system check.
3. Create the two ECR repositories if needed, then push versioned and `latest` images.
4. Copy the Compose definition to EC2, pull the versioned images from ECR, and restart the application.

### Prepare AWS and EC2

1. Create an EC2 Linux instance in your chosen AWS region. Install Docker Engine, the Docker Compose plugin, AWS CLI, and OpenSSH server/client tools as appropriate.
2. Allow inbound SSH only from the Jenkins agent's network and allow HTTP port 80 for testing. For a public production site, put HTTPS termination in front of the instance (for example, an AWS load balancer with TLS); do not expose the Jenkins UI or unrestricted SSH to the internet.
3. Attach an EC2 instance profile with ECR pull access (for example, `AmazonEC2ContainerRegistryReadOnly`). Add the deployment user to the Docker group.
4. Create `/opt/campusmart`, make it writable by the deployment user, and place a deployment `.env` file there. Start from `.env.example`, set a new `DJANGO_SECRET_KEY`, set `DJANGO_DEBUG=False`, set `DJANGO_ALLOWED_HOSTS` to the instance domain/IP, and set `DJANGO_CSRF_TRUSTED_ORIGINS` to the matching full origin (including `https://` if TLS is enabled). Do not commit or send this file through Jenkins.
5. Ensure the instance has outbound access to ECR and its image layers.

The Compose deployment keeps SQLite in a named Docker volume on the instance. This is appropriate for a small single-instance setup, not a highly available or multi-instance production system. Back up the volume and plan a managed database before scaling out.

### Configure Jenkins

- Create a Linux Jenkins agent with Docker Engine, Docker Compose, AWS CLI, and the ability to connect to EC2 over SSH. Install the Jenkins SSH Agent plugin.
- Give the agent an AWS IAM role or credentials with `sts:GetCallerIdentity` and ECR permissions to create/describe repositories, authenticate, and push images. Prefer an IAM role over long-lived access keys.
- Add the EC2 private key to Jenkins Credentials as an SSH private-key credential. Add the EC2 host key to the agent's `known_hosts`; the pipeline intentionally keeps SSH host-key checking enabled.
- Create a Pipeline job from this repository and use the `Jenkinsfile`. When starting a build, set `AWS_REGION`, `ECR_REPOSITORY`, `EC2_HOST`, `EC2_USER`, `SSH_CREDENTIALS_ID`, and `DEPLOY_PATH` parameters. The defaults target `ap-south-1`, repository base name `campusmart`, EC2 user `ec2-user`, and `/opt/campusmart`.

The first pipeline run fails early until `EC2_HOST` and the Jenkins/AWS/EC2 prerequisites are configured. The pipeline does not provision an EC2 instance, configure DNS/TLS, or create the instance profile.

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
