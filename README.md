## Store Ratings Frontend

### Run
```
cd frontend
npm start
```

### Features
- Register/login with role based navigation
- Admin: dashboard, manage users, create users, manage stores, create stores, view user detail
- User: browse/search stores, rate 1-5, update rating, change password
- Owner: dashboard listing owned stores with average + count, view detailed ratings per store, change password
- Sorting on users and stores tables, filtering on lists

### Validation Rules
Name 20-60 chars, Address <=400, Password 8-16 with uppercase + special char, Email standard pattern.

### Notes
Proxy to backend at `http://localhost:5000` (set in package.json). Keep backend running.
