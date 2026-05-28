# 🎯 AI-Powered Interview Strategist

> A full-stack, AI-driven SaaS application that generates personalized interview preparation strategies by analyzing job descriptions and user profiles — complete with technical & behavioral questions, skill gap analysis, and a day-by-day task tracker.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI-Driven Assessment** | Dynamically generates technical & behavioral questions and identifies skill gaps using GenAI |
| ⚡ **Optimized Search** | Database-level search with 1000ms debounce — reduces backend API calls by up to 80% |
| 🚀 **Real-Time Task Tracker** | Optimistic UI updates eliminate network latency and UI flicker on the preparation roadmap |
| 📄 **Client-Side PDF Export** | Uses the browser's native print engine (CSR) — zero server cost, high-resolution output |
| 🛡️ **Secure Auth** | JWT authentication with Token Blacklisting in MongoDB for irreversible session termination |

---

## 🛠️ Tech Stack

**Frontend** — React.js (Vite), SCSS (Custom Dark Theme), React Router DOM, Context API / Custom Hooks

**Backend** — Node.js, Express.js, MongoDB & Mongoose, JWT & bcryptjs, Multer

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/interview-strategist.git
cd interview-strategist
```

### 2. Setup Backend

```bash
cd Backend
npm install
```

Create a `.env` file inside the `Backend` directory:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```

Start the server:

```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd ../front-end
npm install
npm run dev
```

---

## 🔐 API Routes

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Authenticate user & issue JWT | Public |
| GET | `/api/auth/logout` | Clear cookie & blacklist JWT | Private |
| GET | `/api/interview/` | Fetch all interview reports (w/ search) | Private |
| POST | `/api/interview/` | Generate a new AI strategy plan | Private |
| PATCH | `/api/interview/report/:id/task` | Toggle roadmap task completion | Private |
