# 📚 Library Management System (LMS)

[cite_start]A full-stack web application designed to manage library operations, including book inventory, user management, and borrowing transactions[cite: 3]. [cite_start]This system streamlines the process of issuing and returning books while tracking fines and due dates[cite: 5].

> **Project Status:** Complete (MVP + Bonus Features)

---

## 🚀 Features

### 👤 User Features (Student Portal)
* [cite_start]**Authentication:** Secure registration and login for students[cite: 11, 12].
* [cite_start]**Book Catalog:** Browse available books with details (Title, Author, Category, Availability)[cite: 16].
* [cite_start]**Search & Filter:** Search books by title/author or filter by category (Science, Fiction, History)[cite: 30].
* **Smart Borrowing:** * Borrow books instantly (Real-time stock updates).
    * [cite_start]**Limit Enforcement:** Users cannot borrow more than **3 books** at a time[cite: 17, 32].
* [cite_start]**My Books Dashboard:** View active loans, due dates, and return books[cite: 20].
* **Fines System:** Automatic fine calculation ($5/day) for late returns.
* [cite_start]**Alerts:** Visual notifications for books due within 3 days[cite: 33].

### 🛡️ Admin Features
* [cite_start]**Inventory Management:** Add, Edit, and Delete books from the system[cite: 22, 23, 24].
* [cite_start]**User Management:** View registered members and delete accounts[cite: 25].
* **Admin Dashboard:** View key statistics:
    * Total Borrowed Books
    * Total Returned Books
    * [cite_start]Overdue Books[cite: 34].
* [cite_start]**Filtering:** Admin-specific filters for category and authors[cite: 31].

---

## [cite_start]🛠️ Tech Stack [cite: 6]

* [cite_start]**Frontend:** HTML5, CSS3 (Responsive/Mobile-First), JavaScript (Vanilla)[cite: 7, 28].
* [cite_start]**Backend:** Node.js, Express.js (REST API)[cite: 8].
* [cite_start]**Database:** MySQL (Relational Data Management)[cite: 9].

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### 1. Prerequisites
* [Node.js](https://nodejs.org/) installed.
* [MySQL Server](https://dev.mysql.com/downloads/installer/) installed and running.

### 2. Database Configuration
1.  Open **MySQL Workbench**.
2.  Run the SQL script provided in `database_setup.sql` (or see below) to create the schema and seed data.
3.  *Note: The system comes pre-loaded with diverse books including Indian authors.*

```sql
CREATE DATABASE library_db;
USE library_db;