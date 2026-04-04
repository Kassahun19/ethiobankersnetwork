# EthioBankers Network

Professional networking and job platform for the Ethiopian banking industry.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend:** Node.js, Express, Socket.io, JWT
- **Database:** Firebase Firestore
- **AI:** Google Gemini AI (CV Analysis & Job Recommendations)

## Features
- **Authentication:** JWT-based login/register with roles (User, Employer, Admin)
- **Job System:** Browse, search, and apply for banking jobs in Ethiopia.
- **Messaging:** Real-time chat between professionals and employers.
- **Dashboard:** User-specific stats, recent applications, and profile management.
- **Subscription:** Tiered plans (Free, Premium, Pro) with feature restrictions.
- **AI Career Insights:** CV analysis and job matching powered by Gemini.
- **Verification:** Verified badge for confirmed bank employees.

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables:**
   Create a `.env` file based on `.env.example`. You'll need:
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
   - Firebase Configuration

3. **Run the Application:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

4. **Seed Initial Data (Optional):**
   ```bash
   npx tsx seed.ts
   ```

## Project Structure
- `/backend`: Express controllers, routes, and middleware.
- `/src`: React frontend components, pages, and context.
- `/server.ts`: Main entry point for the full-stack application.
- `firestore.rules`: Security rules for the database.
- `firebase-blueprint.json`: Data schema definition.
