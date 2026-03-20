# DUMP — Project Context

## What it is
Anonymous emotional platform for Gen Z. No accounts, no emails.
Users get a UUID stored in localStorage. That's their identity.

## Tech Stack
- Frontend: React (Vite) + Tailwind + Axios + React Router
- Backend: Node.js + Express + MongoDB (Atlas) + Mongoose
- Deployment: Frontend → Vercel, Backend → Render

## Folder Structure
frontend/src/
  pages/
  components/
  services/      ← axios calls live here
  hooks/
  context/
  utils/

backend/src/
  config/
  controllers/
  models/
  routes/
  middleware/
  services/
  utils/
  app.js
  server.js

## API Base URL
- Local: http://localhost:5000/api/v1
- Production: TBD (Render URL)

## Phase 1 API Endpoints
POST   /posts          → create post
GET    /posts          → get all posts (paginated)
GET    /posts/:id      → get single post
DELETE /posts/:id      → delete own post
POST   /replies        → add reply
GET    /replies/:postId → get replies for post

## Standard Response Format
Success: { success: true, data: {}, message: "" }
Error:   { success: false, error: "" }

## Anonymous ID System
- Generated once on first visit
- Stored in localStorage as "anonId"
- Sent in request body with every POST/DELETE

## Current Phase
Phase 0 — Foundation only. No features yet.
