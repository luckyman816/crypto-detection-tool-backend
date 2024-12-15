
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const tokenRoutes = require('./routes/api/tokens');
const transactionRoutes = require('./routes/api/transactions');

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/static", express.static(__dirname + "/public"));

mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB connection error:', err));

app.use('/api/tokens', tokenRoutes);
app.use('/api/transactions', transactionRoutes);
app.get("/api/get-suv-version", (req, res) => {
    res.send(
      JSON.stringify({
        version: "1.0.0",
        file: "suv-1.0.0.zip",
        update_at: "2023-06-14",
      })
    );
  });
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
