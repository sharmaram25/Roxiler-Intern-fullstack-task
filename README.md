<div align="center">
	<h1>Store Ratings Platform</h1>
	<p><em>Full Stack Internship Coding Challenge Submission</em></p>
</div>

## 1. Problem Statement
Build a role-based web platform where users can rate registered stores (1–5). Roles: System Administrator, Normal User, Store Owner. Each role gets specific capabilities while sharing a unified authentication system.

## 2. Tech Stack
| Layer | Choice |
|-------|--------|
| Frontend | React (CRA) + React Router |
| Backend | Express.js |
| Database | PostgreSQL |
| Auth | JWT (Bearer) |
| Password Hash | bcrypt |

## 3. Features by Role
### System Administrator
- Create users (admin / user / owner) and stores.
- Dashboard stats: total users, stores, ratings.
- List + filter + sort users (name, email, address, role).
- List + filter + sort stores (name, address) with average rating.
- View user details (includes owner average rating if owner).

### Normal User
- Self sign-up (name, email, address, password).
- Browse/search stores by name or address.
- See overall average rating + own rating per store.
- Rate or modify rating (1–5).
- Change password.

### Store Owner
- Dashboard: owned stores with average rating and rating count.
- View detailed list of ratings (user name + email + rating) per owned store.
- Change password.

## 4. Validation Rules
| Field | Rule |
|-------|------|
| Name | 20–60 chars |
| Address | <= 400 chars |
| Password | 8–16 chars; at least 1 uppercase & 1 special char |
| Email | Standard email pattern |
| Rating | Integer 1–5 |

## 5. Data Model (Simplified)
```
users(id, name, email, password, address, role, created_at)
stores(id, name, email, address, owner_id, created_at)
ratings(id, user_id, store_id, rating, created_at) UNIQUE(user_id, store_id)
```

## 6. API Overview
Auth: POST /api/auth/register, POST /api/auth/login
Users (admin): POST /api/users, GET /api/users, GET /api/users/:id
Password Change: PUT /api/users/password/change
Stores: POST /api/stores (admin), GET /api/stores (filters + sorting + user rating)
Ratings: POST /api/ratings/:storeId
Owner: GET /api/owner/stores, GET /api/owner/stores/:id/ratings
Admin Stats: GET /api/admin/stats

## 7. Frontend Routes
```
/
/login
/register
/stores
/change-password
/admin
/admin/users
/admin/users/create
/admin/users/:id
/admin/stores
/admin/stores/create
/owner
```

## 8. Running the Project
### 8.1 Backend
1. Copy `backend/.env.example` to `backend/.env` and fill values.
2. Create database:
```
createdb store_ratings
```
3. Apply schema:
```
psql -d store_ratings -f backend/schema.sql
```
4. Install & run:
```
npm install
node backend/index.js
```

### 8.2 Frontend
```
cd frontend
npm install
npm start
```
Development proxy (`package.json`) points to `http://localhost:5000`.

### 8.3 First-Time Flow (Manual Test)
1. Admin (seed manually or convert an existing user in DB) logs in, creates owner + store.
2. User self-registers, logs in, rates store (1–5).
3. Owner logs in, views dashboard and rating details.
4. User changes password; re-authenticate to confirm.
5. Admin dashboard reflects rating count increment.

## 9. Security Notes
- Passwords hashed with bcrypt (cost 10).
- JWT lifespan: 1 day.
- Role checks enforced in middleware.
- Basic server & client validation (can be extended).

## 10. Possible Enhancements (Future Work)
- Pagination and server-side sorting indexes.
- Central error handling + toast notifications.
- Dockerization & CI pipeline.
- Integration + unit tests (Jest + Supertest + React Testing Library).
- Refresh tokens / HTTP-only cookie auth.

## 11. Design Choices & Trade-offs
- Simplicity prioritized over abstraction: direct SQL queries instead of ORM for transparency.
- Single repo structure for quick evaluation; could split later.
- Minimal dependencies to ease review and avoid build complexity.

## 12. Project Structure
```
backend/
	index.js
	db.js
	routes/
	middleware/
	schema.sql
frontend/ (React app)
README.md
.gitignore
```

## 13. Setup Assumptions
- Local PostgreSQL available.
- Node 18+.
- No production optimizations (caching, compression) enabled.

## 14. Author Notes
Built for the Full Stack Internship Challenge to demonstrate:
- End-to-end feature completeness
- Role-based access control
- Clean, concise implementation

Feel free to open issues or request additional refinements.
