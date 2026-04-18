require('dotenv').config();
const express = require('express');
const connectDB = require('./utils/db');
const authRoutes = require('./routes/Auth');


const app = express();
const PORT = process.env.PORT || 5000;

app.use('/api/auth', authRoutes);
// app.use('/api/claims', claimsRoutes);



connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

module.exports = app;
