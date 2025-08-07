const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
    } else {
        console.log('SQLite veritabanına bağlandı.');
    }
});

db.serialize(() => {
    // Admin tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);

    // Article tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS article (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            publish_date TEXT,
            update_date TEXT,
            like_count INTEGER DEFAULT 0,
            writer_id INTEGER,
            share_count INTEGER DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            FOREIGN KEY (writer_id) REFERENCES admin(id)
        )
    `);

    // Tag tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS tag (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL UNIQUE
        )
    `);

    // Çoktan çoğa ilişki için Article-Tag bağlantı tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS article_tag (
            article_id INTEGER,
            tag_id INTEGER,
            FOREIGN KEY (article_id) REFERENCES article(id),
            FOREIGN KEY (tag_id) REFERENCES tag(id),
            PRIMARY KEY (article_id, tag_id)
        )
    `);

    // Comment tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS comment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER,
            reader_name TEXT NOT NULL,
            like_count INTEGER DEFAULT 0,
            comment_date TEXT,
            comment_content TEXT,
            FOREIGN KEY (article_id) REFERENCES article(id)
        )
    `);

    console.log('Tüm tablolar başarıyla oluşturuldu.');
});

module.exports = db;
