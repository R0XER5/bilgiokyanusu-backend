const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin kaydetme
router.post('/', (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    // Basit doğrulama
    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ error: 'Tüm alanlar gereklidir.' });
    }

    const query = `
        INSERT INTO admin (first_name, last_name, email, password)
        VALUES (?, ?, ?, ?)
    `;
    db.run(query, [first_name, last_name, email, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
            }
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası.' });
        }

        return res.status(201).json({
            message: 'Admin başarıyla oluşturuldu.',
            admin: {
                id: this.lastID,
                first_name,
                last_name,
                email
            }
        });
    });
});
// id ile admin getir
router.get('/:id', (req, res) => {
    const adminId = req.params.id;

    const query = `SELECT id, first_name, last_name, email FROM admin WHERE id = ?`;

    db.get(query, [adminId], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası.' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Admin bulunamadı.' });
        }

        res.json(row);
    });
});

module.exports = router;
