# MCAN Southwest Backend — Frontend Integration Guide

This is the API your frontend talks to. It's a REST API (Express 5 + MySQL), documented
interactively via Swagger, with JWT-based auth.

## Base URL

| Environment | URL |
|---|---|
| Local dev | `http://localhost:5000/api` |
| Production (Render) | `https://<your-render-service>.onrender.com/api` |

All endpoint paths below are relative to this base URL — e.g. "`POST /auth/login`" means
`POST http://localhost:5000/api/auth/login`.

## Explore & test endpoints live

Swagger UI is served at **`/api-docs`** (not under `/api`), e.g.
`http://localhost:5000/api-docs`. It lists every endpoint with request/response schemas and
lets you send real requests from the browser — use the **Authorize** button to paste an
access token once you've logged in, so protected routes work in the try-it-out panel too.

---

## Auth flow

1. **Register** — `POST /auth/register`. Account is created with `status: "pending"`; an
   admin must activate it before login succeeds for non-admin flows that check status.
2. **Login** — `POST /auth/login` with `{ email, password }`.
   - Response body: `{ accessToken, user }`.
   - The **refresh token** is set automatically as an **httpOnly cookie** — you never see or
     store it in JS. Your `fetch`/axios client just needs `credentials: "include"` (fetch) or
     `withCredentials: true` (axios) so the browser sends/receives that cookie.
3. **Store the access token** in memory (e.g. a React context/store) — **not** localStorage,
   to reduce XSS exposure. It's short-lived (15 min by default).
4. **Call protected endpoints** with:
   ```
   Authorization: Bearer <accessToken>
   ```
5. **When you get a 401 with `error.code: "TOKEN_EXPIRED"`**, call `POST /auth/refresh`
   (no body needed — it reads the refresh cookie) to get a new access token, then retry the
   original request. This is the standard "silent refresh" pattern — wire it into your HTTP
   client's response interceptor.
6. **Logout** — `POST /auth/logout` revokes the refresh token and clears the cookie.

```js
// Example axios setup
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // required for the refresh cookie
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.data?.error?.code === "TOKEN_EXPIRED") {
      const { data } = await api.post("/auth/refresh");
      accessToken = data.data.accessToken; // update wherever you store it
      err.config.headers.Authorization = `Bearer ${accessToken}`;
      return api.request(err.config);
    }
    return Promise.reject(err);
  }
);
```

---

## Response shape (every endpoint)

**Success:**
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { "...": "..." },
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```
`meta` only appears on paginated list endpoints.

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

### Error codes to branch on in the UI

| HTTP | `error.code` | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request |
| 401 | `UNAUTHORIZED` | Missing/invalid access token |
| 401 | `TOKEN_EXPIRED` | Access token expired — call `/auth/refresh` and retry |
| 403 | `FORBIDDEN` | Valid token, wrong role/ownership |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate (e.g. email already registered) |
| 422 | `VALIDATION_ERROR` | Failed request validation — check `error.details` |
| 429 | `RATE_LIMITED` | Too many requests, slow down |
| 500 | `INTERNAL_ERROR` | Server-side bug |

---

## Roles

| Role | Can do |
|---|---|
| `member` | Own profile, request/view own digital ID |
| `admin` | + manage news, events, members, contact, digital ID approvals |
| `superadmin` | + manage admin accounts, hard-delete contacts, revoke digital IDs |

`GET /members/:id` and `PATCH /members/:id` accept either the numeric user id or the
human-readable `memberId` (e.g. `MCAN-SW-2026-0001`) as `:id`.

---

## Pagination & sorting

List endpoints accept:
```
?page=1&limit=20&sortOrder=desc
```
Response includes `meta.total` / `meta.totalPages` — use those to drive your pager UI.

---

## Endpoint map

Full request/response schemas live in Swagger (`/api-docs`). Quick reference:

| Area | Endpoints |
|---|---|
| **Auth** | `POST /auth/register`, `/login`, `/logout`, `/refresh`, `GET /auth/me`, `PATCH /auth/change-password`, `POST /auth/forgot-password`, `/reset-password` |
| **Members** | `GET /members` (admin), `GET/PATCH /members/:id`, `PATCH /members/:id/status`, `PATCH /members/:id/photo`, `DELETE /members/:id` |
| **News** | `GET /news`, `GET /news/admin/all` (admin), `GET /news/:slug`, `POST /news`, `PUT /news/:id`, `PATCH /news/:id/publish`, `/unpublish`, `DELETE /news/:id` |
| **Events** | `GET /events`, `GET /events/admin/all` (admin), `GET /events/:slug`, `POST /events`, `PUT /events/:id`, `PATCH /events/:id/publish`, `/cancel`, `DELETE /events/:id` |
| **Contact** | `POST /contact` (public), `GET /contact` (admin), `GET/PATCH /contact/:id`, `DELETE /contact/:id` (superadmin) |
| **Admin Users** | `GET /admin-users`, `POST /admin-users/invite`, `PATCH /admin-users/:id/role`, `/deactivate`, `/reactivate` (all superadmin) |
| **Digital ID** | `POST /digital-id/request`, `GET /digital-id/my-id`, `GET /digital-id` (admin), `GET /digital-id/:id`, `PATCH /digital-id/:id/approve`, `/reject`, `/revoke`, `GET /digital-id/:id/download/image`, `/pdf` |
| **Upload** | `POST /upload/image`, `/document`, `/signature` (multipart form-data), `DELETE /upload/:publicId` |
| **Stats** | `GET /admin/stats?period=30d` (admin dashboard aggregates) |
| **Donations** | `GET /donations` (admin), `GET /donations/stats`, `POST /donations`, `PATCH /donations/:id`, `DELETE /donations/:id` |
| **Executives** | `GET /executives` (public), `POST /executives`, `PUT /executives/:id`, `DELETE /executives/:id` |
| **Gallery** | `GET /gallery` (public), `POST /gallery/upload`, `POST /gallery`, `PUT /gallery/:id`, `DELETE /gallery/:id` |
| **Lodges** | `GET /lodges?status=&state=` (public), `POST /lodges`, `PUT /lodges/:id`, `DELETE /lodges/:id` |
| **Web Content** | `GET /webcontent` (public), `PUT /webcontent` (admin) — singleton headline + section-visibility toggles |
| **Programs** | `GET /programs` (public, read-only) |

### Uploads

`/upload/image`, `/upload/document`, `/upload/signature` expect `multipart/form-data` with
a `file` field (and optional `folder` field for `/upload/image`, one of
`members | news | events | digital-id | general`). Response gives you back a Cloudinary
`url` — use that URL directly wherever the API expects e.g. `coverImage` or `passportPhoto`.

### Donations amount handling

`POST /donations` and `PATCH /donations/:id` take `amount` as a **plain number** (e.g.
`50000`). The API returns both fields: `amountValue` (the raw number, for calculations) and
`amount` (a formatted NGN currency string, e.g. `"₦50,000"`, ready to render directly).

### Digital ID card downloads

`GET /digital-id/:id/download/image` and `/download/pdf` don't return the file directly —
they return a **signed, time-limited URL** (`{ downloadUrl, expiresIn, fileName }`, 10 min
validity). Fetch that endpoint, then point the user at `downloadUrl` (e.g. open in a new tab
or set as an `<a href>`).

---

## CORS

The API only allows requests from the single origin configured in its `FRONTEND_URL` env var,
with credentials enabled. If your frontend runs somewhere else during development (different
port, ngrok URL, etc.), ask whoever manages the backend to update `FRONTEND_URL` — CORS errors
will otherwise appear as opaque network failures in devtools even though the request "works"
when tested via curl/Swagger.

## Timestamps

All dates are UTC ISO 8601 strings (e.g. `2026-07-20T09:00:00.000Z`) — convert to local time
on the frontend.
