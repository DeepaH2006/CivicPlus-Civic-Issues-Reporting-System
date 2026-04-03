# Civic Plus 🚀

Civic Plus is a crowd-sourced civic issue reporting system that allows citizens to report local problems such as potholes, garbage accumulation, water issues, and streetlight failures. The system helps authorities track, manage, and resolve complaints efficiently.

## 🔧 Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Maps: Leaflet.js (OpenStreetMap)
- Styling: Tailwind CSS

## ✨ Features
- 👤 User Authentication (Login / Signup)
- 📍 GPS-based complaint reporting
- 📷 Upload issue images
- 🗂 Automatic department assignment
- 📊 Status tracking (Pending / In Progress / Resolved)
- 🗺 Map view of complaints with live markers
- 🏢 Admin dashboard for monitoring
- 👷 Field staff dashboard for updates

## 📍 How It Works
1. Citizen logs in and reports an issue
2. Location and details are captured
3. Backend assigns the appropriate department
4. Complaint is stored in the database
5. Field staff updates the status
6. Issue is visualized on the map

## ▶️ Run Locally

### Backend
```bash
cd backend
npm install
npm start
