/**
 * Library Management System API
 * Tech Stack: Node.js, Express, MySQL
 */

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // UPDATE WITH YOUR CONFIG
    password: 'rohan', // UPDATE WITH YOUR CONFIG
    database: 'library_db'
});

db.connect(err => {
    if (err) {
        console.error('CRITICAL: DB Connection Failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL Database.');
});

/* ==========================
   AUTH ROUTES
   ========================== */

// Handle User Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) res.json({ success: true, user: result[0] });
        else res.json({ success: false, message: 'Invalid credentials' });
    });
});

// Handle User Registration
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;
    const userRole = role === 'admin' ? 'admin' : 'user'; // Fallback to user
    
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.query(sql, [username, password, userRole], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.json({ success: false, message: 'Username taken' });
            return res.status(500).send(err);
        }
        res.json({ success: true, message: 'Account created successfully' });
    });
});

/* ==========================
   BOOK INVENTORY ROUTES
   ========================== */

// Fetch Books with Optional Search/Filter
app.get('/api/books', (req, res) => {
    const { search, category } = req.query;
    let sql = 'SELECT * FROM books WHERE 1=1'; // Base query
    let params = [];

    if (search) {
        sql += ' AND (title LIKE ? OR author LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== 'All') {
        sql += ' AND category = ?';
        params.push(category);
    }

    sql += ' ORDER BY title ASC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Add New Book (Admin)
app.post('/api/books', (req, res) => {
    const { title, author, category, quantity } = req.body;
    const sql = 'INSERT INTO books (title, author, category, quantity) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, author, category, quantity], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Book added to inventory' });
    });
});

// Update Existing Book (Admin)
app.put('/api/books/:id', (req, res) => {
    const { title, author, category, quantity } = req.body;
    const sql = 'UPDATE books SET title=?, author=?, category=?, quantity=? WHERE id=?';
    db.query(sql, [title, author, category, quantity, req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, message: 'Book details updated' });
    });
});

// Delete Book (Admin)
app.delete('/api/books/:id', (req, res) => {
    db.query('DELETE FROM books WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, message: 'Book removed from inventory' });
    });
});

/* ==========================
   TRANSACTION ROUTES
   ========================== */

// Borrow Book logic: Checks limits -> Checks stock -> Records transaction
app.post('/api/borrow', (req, res) => {
    const { user_id, book_id } = req.body;
    const BORROW_LIMIT = 3;

    // 1. Check user's current borrow count
    const countSql = "SELECT COUNT(*) AS count FROM transactions WHERE user_id = ? AND status = 'borrowed'";
    db.query(countSql, [user_id], (err, countResult) => {
        if (err) return res.status(500).send(err);
        
        if (countResult[0].count >= BORROW_LIMIT) {
            return res.json({ success: false, message: `Borrow limit reached (${BORROW_LIMIT} books max).` });
        }

        // 2. Check book availability
        db.query('SELECT quantity FROM books WHERE id = ?', [book_id], (err, bookResult) => {
            if (bookResult[0].quantity > 0) {
                // 3. Process Borrow
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 14); // 2-week loan period

                db.query('UPDATE books SET quantity = quantity - 1 WHERE id = ?', [book_id]);
                db.query('INSERT INTO transactions (user_id, book_id, due_date) VALUES (?, ?, ?)', 
                    [user_id, book_id, dueDate]);
                
                res.json({ success: true, message: `Success. Due Date: ${dueDate.toLocaleDateString()}` });
            } else {
                res.json({ success: false, message: 'Item currently out of stock.' });
            }
        });
    });
});

// Return Book logic: Calculates fines -> Updates status -> Restocks book
app.post('/api/return', (req, res) => {
    const { user_id, book_id } = req.body;
    const FINE_PER_DAY = 5.00; // Currency unit

    const getDueSql = `SELECT due_date FROM transactions WHERE user_id = ? AND book_id = ? AND status = 'borrowed'`;
    db.query(getDueSql, [user_id, book_id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.json({ success: false, message: 'No active transaction found.' });

        const dueDate = new Date(results[0].due_date);
        const returnDate = new Date();
        let fine = 0;
        
        // Calculate overdue days
        const diffTime = returnDate - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays > 0) fine = diffDays * FINE_PER_DAY;

        const updateSql = `UPDATE transactions SET status = 'returned', return_date = NOW(), fine = ? 
                           WHERE user_id = ? AND book_id = ? AND status = 'borrowed'`;

        db.query(updateSql, [fine, user_id, book_id], (err) => {
            if (err) return res.status(500).send(err);
            
            // Restock book
            db.query('UPDATE books SET quantity = quantity + 1 WHERE id = ?', [book_id]);
            
            const msg = fine > 0 ? `Returned LATE. Fine: $${fine}.` : 'Returned successfully.';
            res.json({ success: true, message: msg });
        });
    });
});

// Fetch User's Active Loans
app.get('/api/mybooks/:userId', (req, res) => {
    const sql = `SELECT books.id as book_id, books.title, transactions.due_date 
                 FROM transactions 
                 JOIN books ON transactions.book_id = books.id 
                 WHERE transactions.user_id = ? AND transactions.status = 'borrowed'`;
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

/* ==========================
   ADMIN & UTILITY ROUTES
   ========================== */

// Dashboard Metrics
app.get('/api/admin/stats', (req, res) => {
    const stats = {};
    // Execute parallel queries for efficiency
    db.query("SELECT COUNT(*) as borrowed FROM transactions WHERE status = 'borrowed'", (err, r1) => {
        stats.borrowed = r1[0].borrowed;
        db.query("SELECT COUNT(*) as returned FROM transactions WHERE status = 'returned'", (err, r2) => {
            stats.returned = r2[0].returned;
            db.query("SELECT COUNT(*) as overdue FROM transactions WHERE status = 'borrowed' AND due_date < NOW()", (err, r3) => {
                stats.overdue = r3[0].overdue;
                res.json(stats);
            });
        });
    });
});

// User Management
app.get('/api/users', (req, res) => {
    db.query('SELECT id, username, role FROM users', (err, results) => res.json(results));
});

app.delete('/api/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, message: 'User deleted.' });
    });
});

// Notifications (Due soon)
app.get('/api/notifications/:userId', (req, res) => {
    const sql = `SELECT COUNT(*) as count FROM transactions 
                 WHERE user_id = ? AND status = 'borrowed' AND due_date < DATE_ADD(NOW(), INTERVAL 3 DAY)`;
    db.query(sql, [req.params.userId], (err, results) => res.json(results));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));