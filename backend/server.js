const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/horoscope',require('./routes/horoscope'));
app.use('/api/matches',  require('./routes/matches'));
app.use('/api/wedding',  require('./routes/wedding'));
app.use('/api/vendors',  require('./routes/vendors'));
app.use('/api/budget',   require('./routes/budget'));
app.use('/api/chatbot',  require('./routes/chatbot'));
app.use('/api/honeymoon',require('./routes/honeymoon'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RaashiLink.AI API is running' });
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;