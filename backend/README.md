## Store Ratings Backend

### Prereqs
PostgreSQL running locally and a database created (name matches `DB_NAME` in `.env`).

### Env
Create `backend/.env`:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_pass
DB_NAME=store_ratings
JWT_SECRET=change_me
```

### Install
From project root (package.json already there for backend deps):
```
npm install
```

### Initialize DB
Run the SQL in `backend/schema.sql` against the database.

### Run
```
node backend/index.js
```

### Main Endpoints
Auth: `POST /api/auth/register`, `POST /api/auth/login`
Users (admin): `POST /api/users`, `GET /api/users`, `GET /api/users/:id`
Change password: `PUT /api/users/password/change`
Stores: `POST /api/stores` (admin), `GET /api/stores`
Ratings: `POST /api/ratings/:storeId`, `GET /api/ratings/store/:storeId` (owner)
Admin stats: `GET /api/admin/stats`
Owner: `GET /api/owner/stores`, `GET /api/owner/stores/:id/ratings`

### Notes
Password rules: 8-16 chars, at least one uppercase and one special.
Name 20-60 chars, address <= 400.
