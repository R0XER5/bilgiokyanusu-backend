const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:5174', // frontend'in adresi
    credentials: true
  }));
  
app.use(express.json());

const adminRoutes = require('./routes/admin');
const articleRoutes = require('./routes/article');

app.use('/admins', adminRoutes);
app.use('/articles', articleRoutes);

app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} adresinde çalışıyor.`);
});
