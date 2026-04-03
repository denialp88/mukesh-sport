# Mukesh Sport - Staff Mobile App

## Project Overview

**Mukesh Sport** is a sports equipment shop that also provides repair services. The shop needs an internal **staff-only mobile app** to manage two core business operations:

1. **Installment Tracking & Reminders** — Customers purchase equipment on installments; staff need to record, track, and get reminders for upcoming payments.
2. **Repair Job Management & Customer Status Sharing** — Customers bring equipment for repair and frequently call to ask about status. Staff need to register repair jobs, update status, and share a live tracking link with customers so they can self-check status on their phone.

> **Important:** The mobile app is **only for Mukesh Sport staff**. Customers do **not** install any app — they receive a web-based tracking link (via SMS/WhatsApp) to check repair status.

---

## Users & Roles

| Role | Access | Description |
|------|--------|-------------|
| **Owner / Admin** | Full access | Can manage everything — staff, customers, installments, repairs, settings |
| **Staff** | Operational access | Can create/update installment records, register repairs, update repair status |
| **Customer** | Web link only (no app) | Receives a tracking link to view repair status on their phone browser |

---

## Module 1: Installment Management

### 1.1 Customer Registration
- Add customer with: **Name, Phone Number, Address, Photo (optional)**
- Search and view existing customers
- View customer's installment history

### 1.2 Installment Plan Creation
- Select or create a customer
- Enter product details: **Product Name, Category (e.g., Cricket Bat, Football, Gym Equipment), Brand, Model**
- Enter financial details:
  - **Total Price**
  - **Down Payment (advance amount)**
  - **Remaining Balance** (auto-calculated)
  - **Number of Installments**
  - **Installment Amount** (auto-calculated or manual)
  - **Installment Frequency**: Weekly / Monthly / Custom date
  - **Start Date** of first installment
- Auto-generate installment schedule with due dates

### 1.3 Installment Tracking
- View all active installment plans
- For each plan, show:
  - List of installments with **due date, amount, status (Paid / Pending / Overdue)**
  - Total paid vs. remaining balance
- Mark an installment as **Paid** with:
  - Payment date
  - Amount received
  - Payment mode (Cash / UPI / Bank Transfer)
  - Receipt note (optional)

### 1.4 Reminders & Notifications
- **Automatic reminders** to staff before installment due date:
  - 2 days before due date — push notification to staff app
  - On due date — push notification to staff app
  - 1 day after overdue — push notification marked as urgent
- **Optional SMS/WhatsApp reminder** to customer (configurable per plan)
- Dashboard showing:
  - Today's due installments
  - Overdue installments (highlighted in red)
  - Upcoming installments (next 7 days)

### 1.5 Installment Reports
- Filter by: Customer, Date Range, Status (Paid / Pending / Overdue)
- Summary: Total receivable, Total received, Total overdue
- Export option (PDF / Excel) — future enhancement

---

## Module 2: Repair Job Management

### 2.1 Register a Repair Job
- Select or create customer (Name, Phone Number)
- Enter item details:
  - **Item Name** (e.g., Cricket Bat, Treadmill, Badminton Racket)
  - **Item Photo** (camera capture or gallery)
  - **Problem Description** (text)
  - **Estimated Repair Cost** (optional)
  - **Estimated Completion Date** (optional)
- Auto-generate a **unique Job ID / Token Number**
- Record **received date** automatically

### 2.2 Repair Status Management
- Status workflow:
  ```
  Received → In Progress → Ready for Pickup → Delivered
  ```
- Staff can update status at any time with:
  - New status selection
  - Optional note/comment (e.g., "Waiting for spare part")
  - Photo of progress (optional)
- Status history log (who changed, when, what)

### 2.3 Customer Tracking Link
- When a repair job is registered, generate a **unique web link** (e.g., `https://mukeshsport.app/track/JOB12345`)
- Share this link with the customer via **SMS or WhatsApp** (one-tap share from app)
- **Customer opens the link in their phone browser** (no app needed) and sees:
  - Shop name & logo
  - Job ID / Token Number
  - Item name
  - Current status (with visual progress indicator)
  - Estimated completion date
  - Status history timeline
  - Shop contact number (tap to call)
- The page **auto-refreshes** or customer can pull to refresh

### 2.4 Repair Dashboard
- View all repair jobs filtered by status:
  - Active jobs (Received / In Progress)
  - Ready for Pickup
  - Completed / Delivered
- Search by Job ID, Customer Name, or Phone Number
- Quick-action buttons to update status

### 2.5 Repair Reports
- Total jobs per period
- Average repair time
- Revenue from repairs
- Filter by date range, status, item type

---

## Module 3: Dashboard (Home Screen)

The app home screen shows a quick overview:

- **Today's Due Installments** — count + total amount
- **Overdue Installments** — count + total amount (highlighted)
- **Active Repair Jobs** — count by status
- **Ready for Pickup** — count (highlighted for action)
- Quick-action buttons:
  - ➕ New Installment Plan
  - 🔧 New Repair Job
- Recent activity feed

---

## Technical Requirements

### Platform
- **Mobile App**: React Native with Expo (cross-platform — Android primary, iOS secondary)
- **Customer Tracking Page**: Responsive web page served from backend (EJS template, mobile-friendly)
- **Backend**: Node.js with Express.js (REST API)
- **Database**: PostgreSQL with Knex.js (query builder + migrations)
- **Notifications**: Expo Push Notifications + Firebase Cloud Messaging
- **SMS/WhatsApp**: Integration via API (e.g., Twilio / WhatsApp Business API)

### Authentication
- Staff login with **Phone Number + OTP** or **Username + Password**
- Admin can add/remove staff accounts

### Data & Storage
- All data stored in cloud database
- Item/repair photos stored in cloud storage (e.g., Firebase Storage / AWS S3)
- Daily automatic backup

### Offline Support
- Basic offline viewing of recent records
- Sync when back online

### Security
- Role-based access control
- Data encryption in transit (HTTPS)
- Secure customer tracking links (non-guessable IDs)

---

## Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| **Language** | Hindi + English (bilingual UI) |
| **Performance** | App should load in < 2 seconds |
| **Availability** | 99.5% uptime for tracking links |
| **Scalability** | Support up to 500 active installment plans and 200 active repair jobs |
| **Backup** | Daily automated database backup |

---

## Future Enhancements (Phase 2)

- Inventory management for shop products
- Billing / invoice generation
- Customer loyalty tracking
- Analytics dashboard with charts
- WhatsApp bot for automated status replies
- Payment gateway integration for online installment payments

---

## Summary

| Feature | Staff App | Customer (Web Link) |
|---------|-----------|-------------------|
| Create installment plan | ✅ | ❌ |
| Track installments | ✅ | ❌ |
| Get installment reminders | ✅ | ❌ |
| Register repair job | ✅ | ❌ |
| Update repair status | ✅ | ❌ |
| View repair status | ✅ | ✅ (via tracking link) |
| Dashboard & reports | ✅ | ❌ |
