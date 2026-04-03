# Mukesh Sport - Staff Management App

A mobile app for managing **installment payments** and **repair job tracking** for Mukesh Sport equipment shop.

## Project Structure

```
Mukesh Sport/
├── backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── db/           # Knex config, migrations, seeds
│   │   ├── middleware/    # Auth middleware (JWT)
│   │   ├── routes/       # API routes
│   │   ├── views/        # EJS templates (tracking page)
│   │   └── index.js      # Server entry point
│   ├── .env
│   └── package.json
├── mobile/           # React Native (Expo) Staff App
│   ├── src/
│   │   ├── context/      # Auth context
│   │   ├── navigation/   # Tab + Stack navigation
│   │   ├── screens/      # All app screens
│   │   ├── services/     # API client (Axios)
│   │   └── theme/        # Colors & design tokens
│   ├── App.js
│   └── package.json
└── requirements.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | React Native + Expo |
| **Backend API** | Node.js + Express.js |
| **Database** | PostgreSQL + Knex.js |
| **Auth** | JWT (JSON Web Tokens) |
| **UI** | Custom dark theme + LinearGradient |

---

## Setup Instructions

### 1. Database (PostgreSQL)

Make sure PostgreSQL is installed and running. Create the database:

```sql
CREATE DATABASE mukesh_sport;
```

### 2. Backend

```bash
cd backend
npm install

# Update .env with your PostgreSQL credentials

# Run migrations
npm run migrate

# Seed admin user (Phone: 9999999999, Password: admin123)
npm run seed

# Start server
npm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Mobile App

```bash
cd mobile
npm install

# Update the API URL in src/services/api.js
# Change 192.168.1.100 to your computer's local IP address

# Start Expo
npx expo start
```

Scan the QR code with **Expo Go** app on your phone.

---

## Default Login

| Field | Value |
|-------|-------|
| Phone | `9999999999` |
| Password | `admin123` |

---

## API Endpoints

### Auth
- `POST /api/auth/login` — Staff login
- `POST /api/auth/register` — Create staff (admin only)

### Customers
- `GET /api/customers` — List customers
- `GET /api/customers/:id` — Customer detail
- `POST /api/customers` — Create customer
- `PUT /api/customers/:id` — Update customer

### Installments
- `GET /api/installments/plans` — List plans
- `GET /api/installments/plans/:id` — Plan detail with schedule
- `POST /api/installments/plans` — Create plan (auto-generates schedule)
- `PUT /api/installments/:id/pay` — Mark installment as paid
- `GET /api/installments/dashboard/summary` — Dashboard data

### Repairs
- `GET /api/repairs` — List repair jobs
- `GET /api/repairs/:id` — Job detail with status history
- `POST /api/repairs` — Create repair job (generates tracking link)
- `PUT /api/repairs/:id/status` — Update status
- `PUT /api/repairs/:id/cost` — Set final cost
- `GET /api/repairs/dashboard/summary` — Dashboard data

### Public Tracking
- `GET /track/:token` — Customer tracking page (web, no auth)
