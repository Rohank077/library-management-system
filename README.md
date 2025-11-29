# 📚 Library Management System

A web-based application designed to streamline library operations. This system allows users to browse, borrow, and return books, while providing administrators with tools to manage inventory, users, and track overdue items.

> **Project Status:** Complete (MVP + Bonus Features)

---

## 🚀 Features

### 👤 Student/User Features
* **Secure Authentication:** Registration and login system.
* **Browse & Search:** View book availability and search by Title, Author, or Category.
* **Borrowing System:**
    * Real-time stock updates.
    * **Borrow Limit:** Maximum of 3 books per user.
* **Returns & Fines:**
    * Return books easily.
    * **Late Fee Calculation:** Automatic fine calculation ($5/day) for overdue returns.
* **History Dashboard:** Track borrowed books and due dates.
* **Notifications:** Visual alerts for items due within 3 days.

### 🛡️ Admin Features
* **Inventory Management:** Add, Update, and Delete books.
* **User Management:** View registered users and delete accounts.
* **Admin Dashboard:** Visual metrics for Borrowed, Returned, and Overdue books.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Responsive), JavaScript.
* **Backend:** Node.js, Express.js.
* **Database:** MySQL.

---

## ⚙️ Installation Guide

### 1. Database Setup
1.  Open **MySQL Workbench**.
2.  Run the following SQL to create the database and seed data:

```sql
CREATE DATABASE library_db;
USE library_db;

-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user'
);

-- 2. Books Table
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    quantity INT DEFAULT 1
);

-- 3. Transactions Table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    book_id INT,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NULL,
    return_date DATETIME NULL,
    status ENUM('borrowed', 'returned') DEFAULT 'borrowed',
    fine DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Default Logins
INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin');
INSERT INTO users (username, password, role) VALUES ('student', 'student123', 'user');