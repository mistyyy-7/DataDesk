# DataDesk

**DataDesk** is a management and analytics platform built to demonstrate strong relational database design and SQL skills.

---

## 🏗️ Tech Stack

- **Frontend**: React + Vite (TypeScript), Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js + Express.js
- **Database**: MySQL (`mysql2`)
- **API**: REST architecture

---

## 📁 Project Structure

```text
DataDesk/
├── client/           # React + Vite frontend application
│   ├── src/          # Components, styles, layout
│   └── package.json
├── server/           # Express backend API
│   ├── src/
│   │   ├── config/   # Database configuration & environment settings
│   │   ├── controllers/ # Business logic handlers
│   │   ├── routes/   # Express routes & endpoints
│   │   └── index.js  # Server entry point
│   └── package.json
├── database/         # MySQL schema scripts, migrations & queries (To be designed)
└── README.md
```

---

## 🚀 Getting Started

### 1. Server Setup
```bash
cd server
npm install
npm run dev
```
The server will start at `http://localhost:5000`.  
Health check endpoint: `GET http://localhost:5000/api/health`

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```
The React frontend will start at `http://localhost:5173`.

---

## 📋 Status
- [x] Initial project foundation & directory structure
- [x] Express server setup with `GET /api/health`
- [x] Modern dark-themed SaaS UI dashboard shell (React + Vite + Tailwind CSS)
- [ ] MySQL Database schema design & migrations
- [ ] Relational queries & REST API endpoints
