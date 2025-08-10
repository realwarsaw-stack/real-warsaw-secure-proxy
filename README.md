# R.E.A.L. Warsaw — Secure OpenAI Proxy (Vercel + Supabase)

This project exposes a secure API that:
1) Verifies a student's Supabase JWT,
2) Confirms the student is `active` in the `students` table,
3) Proxies requests to OpenAI **without exposing your OpenAI key** to the client.

It also includes a minimal admin page (`/admin.html`) that lets you toggle a user's active status.

---

## Deploy (quick)
1. Create a **Supabase** project.
2. Run the SQL in `supabase_schema.sql` inside the Supabase SQL editor.
3. In Supabase > Authentication, add your students (email + password).
4. In **Vercel**, create a new project and import this repo. Set these Environment Variables:
   - `OPENAI_API_KEY`: your OpenAI key
   - `OPENAI_MODEL`: (optional) e.g. `gpt-4o-mini`
   - `SUPABASE_URL`: your Supabase project URL (starts with https://...supabase.co)
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-only)
   - `ADMIN_SECRET`: a strong random string for the admin panel
5. Deploy. Visit `https://<your-vercel-app>.vercel.app/admin.html` to manage students.

## API
- `POST /api/openai-proxy`
  - Headers:
    - `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`  (the student's token from Supabase sign-in)
    - `Content-Type: application/json`
  - Body (example):
    ```json
    {"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hi"}]}
    ```
  - Response: raw response from OpenAI's Chat Completions API.

- `GET /api/admin/list`
  - Headers: `x-admin-secret: <ADMIN_SECRET>`
  - Returns: `[{ "user_id": "...", "email": "...", "full_name": "...", "active": true }]`

- `POST /api/admin/toggle`
  - Headers: `x-admin-secret: <ADMIN_SECRET>`, `Content-Type: application/json`
  - Body: `{"user_id":"<uuid>","active":false}`


---

## Notes
- The proxy verifies the student's token against Supabase and checks `students.active=true`.
- `service_role` key is used **only** on the server (Vercel env). It never reaches the client.
