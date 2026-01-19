# Slipstream Deployment Guide

This guide covers how to deploy the Slipstream Control Plane for the hackathon judging process.

## Option 1: Live Cloud Deployment (Recommended)
This approach gives judges a live URL to visit (e.g., `slipstream-demo.vercel.app`).

### 1. Backend (Railway, Render, or Fly.io)
We'll use **Railway** (easiest) or **Render** as they support Python/FastAPI out of the box.
1.  Push your code to GitHub.
2.  Create a new project in Railway/Render from your repo.
3.  **Root Directory**: Set to `backend`.
4.  **Build Command**: `pip install -r requirements.txt`
5.  **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6.  **Copy the URL**: You'll get something like `https://slipstream-backend.up.railway.app`.

### 2. Frontend (Vercel)
1.  Create a new project in Vercel.
2.  **Root Directory**: Set to `frontend`.
3.  **Environment Variables**: Add the following:
    *   `VITE_API_BASE`: `https://slipstream-backend.up.railway.app` (Match your backend URL)
    *   `VITE_WS_URL`: `wss://slipstream-backend.up.railway.app/ws/hub` (Note the **wss://**)
4.  **Deploy**.

---

## Option 2: Local Docker (For Technical Judges)
If you need to submit a repo that runs locally with one command.

### 1. Build Backend Image
```bash
cd backend
docker build -t slipstream-backend .
```

### 2. Run Backend
```bash
docker run -p 8000:8000 slipstream-backend
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

(Note: In a real hackathon submission, you might want a `docker-compose.yml` that does both, but `npm run dev` is often preferred for the frontend to allow hot-reloading if judges want to tweak things).

## Submission Checklist
- [ ] **Video Walkthrough**: Record a 2-minute video going through the "Saga" scenario.
- [ ] **Live Link**: Put the Vercel link in your submission.
- [ ] **Repo**: Ensure `README.md` is clean and links to this `DEPLOYMENT.md`.

---

## 🌐 Custom Domains & Cloudflare
If using a custom domain (e.g., `making-minds.ai`) with Cloudflare:

1.  **Railway/Render**: Add the custom domain in your service settings and copy the CNAME target.
2.  **Cloudflare DNS**: Create a CNAME record pointing to that target.
3.  **SSL**: Cloudflare's "Full" or "Full (Strict)" SSL mode is recommended.
4.  **WebSockets**: Ensure WebSockets are enabled in Cloudflare (usually on by default).
5.  **CORS**: If you encounter CORS issues, ensure the `allow_origins` in `backend/main.py` includes your new domain.
