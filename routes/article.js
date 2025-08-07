const express = require('express');
const router = express.Router();
const db = require('../db');

// Yeni article kaydetme
router.post('/', (req, res) => {
    const {
        title,
        content,
        publish_date,
        update_date,
        like_count = 0,
        writer_id,
        share_count = 0,
        view_count = 0,
        tags = [],       // string array
        comments = []    // comment objeleri array
    } = req.body;

    if (!title || !writer_id) {
        return res.status(400).json({ error: 'title ve writer_id zorunludur.' });
    }

    db.serialize(() => {
        // 1) Article'ı ekle
        const insertArticleQuery = `
            INSERT INTO article 
            (title, content, publish_date, update_date, like_count, writer_id, share_count, view_count) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
            insertArticleQuery,
            [title, content, publish_date, update_date, like_count, writer_id, share_count, view_count],
            function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Makale eklenirken hata oluştu.' });
                }

                const articleId = this.lastID;

                // 2) Tagleri ekle ve article_tag tablosuna bağla
                if (tags.length === 0 && comments.length === 0) {
                    // Hiç tag ve comment yoksa direk dön
                    return res.status(201).json({ message: 'Makale başarıyla oluşturuldu', articleId });
                }

                // Fonksiyonlar promise yaparak sıralı ekleyelim
                const insertTag = (tagText) => {
                    return new Promise((resolve, reject) => {
                        // Önce tag tablosunda var mı kontrol et
                        db.get(`SELECT id FROM tag WHERE text = ?`, [tagText], (err, row) => {
                            if (err) reject(err);

                            if (row) {
                                // Tag varsa, article_tag tablosuna ekle
                                db.run(`INSERT OR IGNORE INTO article_tag(article_id, tag_id) VALUES (?, ?)`, [articleId, row.id], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            } else {
                                // Tag yoksa önce ekle, sonra article_tag'a bağla
                                db.run(`INSERT INTO tag(text) VALUES (?)`, [tagText], function (err) {
                                    if (err) reject(err);
                                    else {
                                        db.run(`INSERT INTO article_tag(article_id, tag_id) VALUES (?, ?)`, [articleId, this.lastID], (err) => {
                                            if (err) reject(err);
                                            else resolve();
                                        });
                                    }
                                });
                            }
                        });
                    });
                };

                const insertComment = (comment) => {
                    return new Promise((resolve, reject) => {
                        const { reader_name, like_count = 0, comment_date, comment_content } = comment;
                        db.run(
                            `INSERT INTO comment(article_id, reader_name, like_count, comment_date, comment_content) VALUES (?, ?, ?, ?, ?)`,
                            [articleId, reader_name, like_count, comment_date, comment_content],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                };

                // Tüm tagleri ekle
                Promise.all(tags.map(insertTag))
                    .then(() => Promise.all(comments.map(insertComment)))
                    .then(() => {
                        res.status(201).json({ message: 'Makale, tag ve yorumlar başarıyla eklendi', articleId });
                    })
                    .catch((err) => {
                        console.error(err);
                        res.status(500).json({ error: 'Tag veya yorum eklenirken hata oluştu.' });
                    });
            }
        );
    });
});
// Tüm makaleleri getir
router.get('/', (req, res) => {
    const query = `
        SELECT 
            article.id,
            article.title,
            article.content,
            article.publish_date,
            article.update_date,
            article.like_count,
            article.writer_id,
            article.share_count,
            article.view_count,
            admin.first_name AS writer_first_name,
            admin.last_name AS writer_last_name
        FROM article
        LEFT JOIN admin ON article.writer_id = admin.id
        ORDER BY article.publish_date DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası.' });
        }

        res.json(rows);
    });
});

module.exports = router;
