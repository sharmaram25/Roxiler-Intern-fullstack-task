require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const storeRoutes = require('./routes/stores');
app.use('/api/stores', storeRoutes);

const ratingRoutes = require('./routes/ratings');
app.use('/api/ratings', ratingRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const ownerRoutes = require('./routes/owner');
app.use('/api/owner', ownerRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
