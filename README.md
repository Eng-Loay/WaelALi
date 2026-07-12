# مستر وائل علي - منصة تدريس الرياضيات

A modern, beautiful math teaching platform for **Mr. Wael Ali**, built with React, Node.js, Express, and MySQL.



## Features

- **Landing Page** — Hero section with teacher photo, stats, and call-to-action
- **Academic Years** — Browse courses by grade (Prep 3, Sec 1, Sec 2)
- **Courses** — Featured and grade-filtered course listings
- **Why Choose Us** — Platform features section
- **About** — Teacher introduction with portrait
- **Testimonials** — Student reviews
- **Subscribe Form** — Student registration with MySQL storage
- **RTL Arabic** — Full right-to-left support with Cairo font
- **Responsive** — Mobile-friendly design

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | React 19 + Vite   |
| Backend  | Node.js + Express |
| Database | MySQL             |

## Project Structure

```
Wael Ali Math/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── database/schema.sql   # Database schema + seed data
│   ├── routes/               # API routes
│   ├── server.js             # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/           # Logo & teacher photos
│   │   ├── components/       # React components
│   │   ├── pages/            # Home & Courses pages
│   │   ├── styles/           # Global CSS
│   │   └── api.js            # API client
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://www.mysql.com/) (v8+)

### 1. Database Setup

Open MySQL and run the schema file (XAMPP uses port 3307):

```bash
cd backend
npm run setup-db
```

Or import `backend/database/schema.sql` using phpMyAdmin at http://localhost/phpmyadmin

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the environment file (already configured for XAMPP):

```
DB_PORT=3307
DB_PASSWORD=
```

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The website opens at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/health`               | Health check             |
| GET    | `/api/grades`               | List all grades          |
| GET    | `/api/grades/:id/courses`   | Courses by grade         |
| GET    | `/api/courses`              | All courses              |
| GET    | `/api/courses?featured=true`| Featured courses only    |
| GET    | `/api/features`             | Platform features        |
| GET    | `/api/testimonials`         | Student testimonials     |
| POST   | `/api/subscribe`            | Register a student       |

## Production Build

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder with any static file server, with the backend API running separately.

## License

Private project for Mr. Wael Ali.
