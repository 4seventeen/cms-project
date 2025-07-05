# Full-Stack Signup App Setup Guide

## 1. Set up Supabase
- Create a free account at [https://supabase.com](https://supabase.com)
- Create a new project
- Go to Settings > API to get your project URL and anon key

## 2. Configure Environment Variables
- In the `server/` directory, create a `.env` file:
  ```env
  SUPABASE_URL=your_supabase_project_url
  SUPABASE_ANON_KEY=your_supabase_anon_key
  PORT=3000
  ```

## 3. Install Dependencies
- In the project root:
  ```sh
  cd server
  npm install
  cd ../client
  npm install
  ```

## 4. Run the Backend
- In `server/`:
  ```sh
  npm run dev
  # or
  node index.js
  ```

## 5. Run the Frontend
- In `client/`:
  ```sh
  npm run dev
  ```
- The app will be at [http://localhost:5173](http://localhost:5173)

## 6. Verify Connection and Signup
- Open the app in your browser.
- Try signing up with a new email and password.
- If successful, you will see a success message.
- Duplicate emails will show an error.

## Notes
- Authentication is handled by Supabase Auth
- Passwords are securely handled by Supabase
- CORS is enabled for the frontend dev server
- No local database setup required 