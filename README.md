# My World – Multi-Store Marketplace

A full-stack e-commerce platform consisting of three applications:

| App | Technology | Directory |
|-----|-----------|-----------|
| **Backend API** | Node.js · Express · Prisma · SQLite/PostgreSQL | `backend/` |
| **Web Admin** | Next.js (React) | `frontend-web/` |
| **Mobile App** | Expo · React Native | `mobile-app/` |

---

## Prerequisites

Make sure the following are installed on your machine before you start:

- [Node.js](https://nodejs.org/) **v18+** and **npm**
- [Expo CLI](https://docs.expo.dev/get-started/installation/) – for the mobile app
- *(Optional)* [PostgreSQL](https://www.postgresql.org/) – the backend defaults to SQLite; switch by editing `DATABASE_URL` in `backend/.env`

---

## 1 · Backend API

### Setup

```bash
# Navigate into the backend directory
cd backend

# Install dependencies
npm install

# Copy the example env file and edit it with your values
cp .env.example .env
```

Open `backend/.env` and adjust the variables as needed:

```env
PORT=3000
NODE_ENV=development

# SQLite (default – no extra setup required)
DATABASE_URL="file:./prisma/dev.db"

# OR PostgreSQL (uncomment and fill in your connection string)
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/myworld_db"

JWT_SECRET="change-me-to-a-strong-random-secret"
JWT_EXPIRES_IN="7d"
```

### Database – first-time setup

```bash
# Generate the Prisma client
npm run db:generate

# Run migrations to create the database schema
npm run db:migrate

# (Optional) Seed initial data
npm run db:seed
```

### Run in development mode

```bash
npm run dev
```

The API will be available at **http://localhost:3000** (or the port set in `.env`).

---

## 2 · Web Admin (Next.js)

### Setup

```bash
# Navigate into the web frontend directory
cd frontend-web

# Install dependencies
npm install
```

> The web app communicates with the backend. Make sure the backend is already running before using the admin panel.

### Run in development mode

```bash
npm run dev
```

Open **http://localhost:3001** in your browser (Next.js will default to `3001` if port `3000` is already taken by the backend).

To force a specific port:

```bash
npx next dev -p 3001
```

---

## 3 · Mobile App (Expo)

### Prerequisites

```bash
# Install Expo CLI globally if you haven't already
npm install -g expo-cli
```

You'll also need one of the following to run the app:

- **Android**: Android Studio with an emulator, *or* a physical device with the [Expo Go](https://expo.dev/go) app installed
- **iOS**: Xcode with a simulator (macOS only), *or* a physical device with the Expo Go app

### Setup

```bash
# Navigate into the mobile directory
cd mobile-app

# Install dependencies
npm install
```

### Run the app

```bash
# Start the Expo dev server (scan the QR code with Expo Go)
npm start

# --- OR target a specific platform ---

# Android emulator / device
npm run android

# iOS simulator (macOS only)
npm run ios

# Web browser (experimental)
npm run web
```

---

## Recommended startup order

1. **Start the backend** → `cd backend && npm run dev`
2. **Start the web admin** → `cd frontend-web && npm run dev`
3. **Start the mobile app** → `cd mobile-app && npm start`

---

## Project structure overview

```
vacant-nebula/
├── backend/          # Express REST API + Prisma ORM
│   ├── prisma/       # Schema, migrations & seed data
│   ├── src/          # Routes, controllers, middlewares
│   └── uploads/      # Local file uploads (dev only)
├── frontend-web/     # Next.js admin panel
│   └── app/          # App Router pages & components
└── mobile-app/       # Expo React Native customer app
    └── src/          # Screens, navigation & services
```

---

## Useful scripts reference

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed the database |
| `npm test` | Run Jest test suite |

### Web Admin

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Serve production build |

### Mobile App

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS |
| `npm run web` | Open in browser |
