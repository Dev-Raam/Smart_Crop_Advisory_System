# Smart Crop Advisory System

Smart Crop Advisory System is a full-stack agriculture support platform with:

- a React + Vite frontend
- a Spring Boot backend for authentication, API orchestration, and history
- a FastAPI ML service for crop recommendation, fertilizer recommendation, pest or disease detection, and model-backed utilities

The project is designed for farmer-friendly workflows such as:

- user sign up and sign in
- crop recommendation based on soil and weather inputs
- fertilizer recommendation
- pest or disease image analysis
- chatbot-style farming guidance
- activity and recommendation history

## Project Structure

```text
smart_crop_advisory_system/
├─ backend/      Spring Boot backend
├─ frontend/     React + Vite frontend
├─ ml-service/   FastAPI machine learning service
└─ README.md
```

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Java 21, Spring Boot, Spring Security, Spring Data MongoDB, JJWT
- Database: MongoDB Atlas
- ML Service: FastAPI, scikit-learn, pandas, numpy, Pillow

## Prerequisites

Install these before running the project:

- Node.js 18+ with npm
- Java 21
- Apache Maven 3.9+
- Python 3.11 or 3.12
- MongoDB Atlas database access

Recommended checks:

```powershell
node -v
npm -v
java -version
mvn -version
python --version
```

## Environment Setup

### Backend `.env`

Create or update [backend/.env](/D:/smart_crop_advisory_system/backend/.env).

Example:

```env
PORT=5000
MONGO_URI=mongodb://USERNAME:PASSWORD@HOST1:27017,HOST2:27017,HOST3:27017/smartcrop?ssl=true&replicaSet=atlas-cfkax4-shard-0&authSource=admin&retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret
JWT_EXPIRATION=90d
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ML_SERVICE_URL=http://127.0.0.1:8000
HUGGINGFACE_API_KEY=your_key_if_used
```

Notes:

- `JWT_EXPIRATION=90d` keeps tokens valid for 90 days.
- The backend currently reads `.env` automatically.
- A standard `mongodb://...` URI is preferred here because it avoids SRV DNS lookup problems some machines face with `mongodb+srv://...`.

### Frontend environment

The frontend works with its default API base URL of `http://localhost:5000`.

If you want to override it, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### ML service environment

No required `.env` file is needed by default for the ML service.

## Installation

### 1. Clone the repository

```powershell
git clone <your-repo-url>
cd smart_crop_advisory_system
```

### 2. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

### 3. Install backend dependencies

The backend uses Maven, so dependencies are resolved automatically when you run it.

```powershell
cd backend
mvn -Dmaven.repo.local=.m2/repository test
cd ..
```

### 4. Install ML service dependencies

Create and activate a virtual environment, then install requirements.

```powershell
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## How To Run The Project

Run the three services in three separate terminals.

### Terminal 1: Backend

```powershell
cd D:\smart_crop_advisory_system\backend
npm run dev
```

This starts the Spring Boot backend on:

```text
http://localhost:5000
```

### Terminal 2: ML Service

```powershell
cd D:\smart_crop_advisory_system\ml-service
venv\Scripts\activate
uvicorn main:app --reload
```

This starts the ML service on:

```text
http://127.0.0.1:8000
```

### Terminal 3: Frontend

```powershell
cd D:\smart_crop_advisory_system\frontend
npm run dev
```

This starts the frontend on:

```text
http://localhost:5173
```

## Health Checks

Use these URLs to verify the services:

- Backend health: [http://localhost:5000/health](http://localhost:5000/health)
- ML service health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Frontend app: [http://localhost:5173](http://localhost:5173)

## Important Runtime Notes

- Do not run the old Node backend and the Spring Boot backend at the same time.
- `backend/npm run dev` now starts Spring Boot.
- If you ever need the older Express server for reference, use:

```powershell
cd backend
npm run dev:legacy
```

- `dev:legacy` and Spring Boot should not run together on port `5000`.

## Main Features

### Authentication

- user registration
- user login
- JWT-based authentication using JJWT
- profile fetch and profile update

### Advisory Features

- crop recommendation via ML service
- fertilizer recommendation via ML service
- pest or disease image analysis via ML service
- chatbot replies with backend fallback logic
- per-user history stored in MongoDB

## API Overview

### Authentication routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

### Service routes

- `POST /api/services/recommend-crop`
- `POST /api/services/recommend-fertilizer`
- `POST /api/services/detect-disease`
- `POST /api/services/chat`
- `GET /api/services/history`
- `DELETE /api/services/history/{id}`

## Build Commands

### Backend

```powershell
cd backend
mvn -Dmaven.repo.local=.m2/repository test
```

### Frontend

```powershell
cd frontend
npm run build
```

### ML service

The ML service does not have a formal build step. Run it with Uvicorn.

## Troubleshooting

### 1. Port 5000 is already in use

Find and stop the process:

```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### 2. MongoDB Atlas connection fails

Check:

- your internet connection
- MongoDB Atlas IP access list
- username and password in `MONGO_URI`
- whether the URI uses the correct replica set and hosts

If `mongodb+srv://...` gives DNS lookup issues, use the standard `mongodb://host1,host2,host3/...` form.

### 3. Frontend loads but crop, fertilizer, chat, or pest detection does nothing

Check that all three services are running:

- frontend on `5173`
- backend on `5000`
- ML service on `8000`

Also verify:

- `ML_SERVICE_URL=http://127.0.0.1:8000` in `backend/.env`
- backend health endpoint works
- ML service health endpoint works

### 4. PowerShell blocks npm scripts

If PowerShell script execution is restricted, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Or use:

```powershell
npm.cmd run dev
```

### 5. Maven repository permission issue

This project is configured to use a local Maven cache under:

```text
backend/.m2/repository
```

So use the provided `npm run dev` flow from the `backend` folder.

## Suggested Startup Order

For the smoothest experience:

1. Start the ML service
2. Start the backend
3. Start the frontend
4. Open the frontend in the browser
5. Sign in and test crop, fertilizer, chatbot, and pest detection

## Future Improvements

- add one root command to start all services together
- add production deployment instructions
- add backend integration tests for service proxy routes
- add Docker support

## License

Add your preferred license here before publishing publicly.
