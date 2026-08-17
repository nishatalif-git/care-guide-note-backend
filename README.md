# Secure Note-Taking API — Backend

REST API for the Secure Note-Taking Application.

Built with **Express 5 + TypeScript + Mongoose + MongoDB**. The backend provides JWT authentication, role-based access control, paginated APIs, deliberate MongoDB indexing, and the two required aggregation scenarios.

## Tech Stack

- Express 5
- TypeScript
- Mongoose
- MongoDB
- JWT (HS256)
- Argon2id password hashing
- Joi validation

## Requirements

- Node.js
- MongoDB

## Setup

```bash
cd care-guide-note-backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

The API runs at:

```text
http://localhost:4000
```

`npm run seed` wipes and repopulates the database.

## Available Scripts

```bash
npm run seed
npm run dev

```

- `seed` — wipes and repopulates the database.
- `dev` — starts the development server.


## Authentication

### Register

```http
POST /api/auth/register
```

Registration always creates a `user`. A client cannot register itself as an admin because the `role` field is stripped during validation.

### Login

```http
POST /api/auth/login
```

Returns:

```json
{
  "user": {},
  "token": "..."
}
```

### Current User

```http
GET /api/auth/me
```

Requires authentication.

## Seeded Accounts

| Role | Email | Password |
| --- | --- | --- |
| admin | `admin@example.com` | `SEED_ADMIN_PASSWORD` from `.env` |
| user | `user1@example.com` | `Password@123` |

## Roles & Permissions

| Capability | user | admin |
| --- | :---: | :---: |
| Create/update/delete own notes | ✅ | ✅ |
| List own notes | ✅ | ✅ |
| Write posts | ✅ | ✅ |
| Browse/search everyone's posts | ✅ | ✅ |
| View everyone's notes | — | ✅ |
| Delete any note | — | ✅ |
| Add/update/remove/list users | — | ✅ |
| Users grouped by interest | — | ✅ |

Admin functionality reuses the same handlers with wider filters rather than duplicating routes. Admins can read/delete any note but cannot edit another user's note.

## API

All list endpoints accept:

```text
?page=1&limit=10
```

The default limit is `10` and the hard maximum is `100`.

### Auth

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | Authenticated | Current profile |

### Notes

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/notes` | Authenticated |
| GET | `/api/notes` | Own notes; admin can use `?all=true` or `?owner=<id>` |
| GET | `/api/notes/:id` | Owner or admin |
| PATCH | `/api/notes/:id` | Owner only |
| DELETE | `/api/notes/:id` | Owner or admin |

### Users

Admin only:

| Method | Path |
| --- | --- |
| GET | `/api/users` |
| POST | `/api/users` |
| GET | `/api/users/:id` |
| PATCH | `/api/users/:id` |
| DELETE | `/api/users/:id` |

Deleting a user cascades to that user's notes and posts.

### Posts & Aggregations

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/posts` | Authenticated |
| GET | `/api/posts?author=<user id or email>` | Public |
| GET | `/api/users/insights/by-interest` | Admin |
| GET | `/api/users/:id/posts` | Public |

The public post feed is paginated and newest-first. It supports filtering by author ID or email.

## Pagination Response

List endpoints return:

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 87,
  "totalPages": 9
}
```

Both aggregation scenarios also paginate.

## Aggregation Scenarios

### 1. Users Grouped by Interest

```http
GET /api/users/insights/by-interest?page=1&limit=10&interest=chess
```

Admin only.

Implemented with exactly one `User.aggregate()` call:

```text
$match
→ $unwind
→ $match
→ $group
→ $sort
→ $facet
→ $project
```

Pagination and total-count metadata are handled inside the same pipeline.

### 2. Posts by User

```http
GET /api/users/:id/posts?page=1&limit=5
```

Public.

Implemented as a single pipeline using `$lookup` to retrieve the user's posts. Pagination is applied with `$slice`, allowing the response to contain both the requested posts and the exact total.

## Indexing Strategy

Indexes are deliberately minimal. Every declared index uses `schema.index(...)`.

### Declared Indexes

| Collection | Index | Purpose |
| --- | --- | --- |
| users | `{ email: 1 }` unique | Login lookup and email uniqueness |
| users | `{ createdAt: -1 }` | Admin user list |
| users | `{ interests: 1 }` | Interest aggregation/filter |
| notes | `{ owner: 1, createdAt: -1 }` | Own notes with newest-first sort |
| notes | `{ createdAt: -1 }` | Admin all-notes list |
| posts | `{ author: 1, createdAt: -1 }` | Author filtering and newest-first sort |

MongoDB also creates the default `_id` index.

Indexes are synchronized on startup with `syncIndexes()`, while automatic index creation is disabled.

### Deliberately Omitted Indexes

The project intentionally does not create redundant or unused indexes, including:

- `{ owner: 1 }` on notes because it is already covered by the compound notes index.
- `{ role: 1 }` on users because the API does not issue a role-filtered query.
- `{ createdAt: -1 }` on posts because the unfiltered feed sorts by `_id`.
- `{ author: 1 }` on posts because the compound author/createdAt index already covers the author filter.
- A text index for name search because no query requires it.
- A separate authorization index because ownership is checked against the already-loaded note.


## Security

- Argon2id password hashing.
- Password hashes are excluded from normal queries.
- Login uses a decoy hash for unknown emails to reduce account-enumeration timing differences.
- JWT uses HS256 with user ID as the subject.
- JWT expiry is configured through `JWT_EXPIRES_IN`.
- Joi validates body, query, and params.
- Unknown request fields are stripped.
- A client cannot submit `role: "admin"` during registration.
- Unauthorized access to another user's note returns `404`, not `403`.
- CORS is restricted to the configured frontend origin.
- JSON request bodies are capped at 100 KB.
- Production errors do not expose stack traces.

## Error Format

Errors use one consistent structure:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "..."
      }
    ]
  }
}
```

## Project Structure

```text
care-guide-note-backend/
  src/
    config/
      env.ts
      db.ts
    models/
      user
      note
      post
    middleware/
      auth
      validate
      error
    modules/
      auth/
      notes/
      users/
      posts/
    utils/
      password
      pagination
      ApiError
    scripts/
      seed.ts
  scripts/
    seed.ts
```