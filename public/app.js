/* * Frontend Controller for LMS
 * Handles UI updates, API calls, and State Management
 */

let currentUser = null;
let isLoginMode = true;
let editingBookId = null;

// ================= AUTHENTICATION =================

function toggleAuth() {
    isLoginMode = !isLoginMode;
    const elements = {
        title: document.getElementById('auth-title'),
        btn: document.getElementById('auth-btn'),
        toggleText: document.querySelector('.auth-toggle'),
        adminDiv: document.getElementById('admin-register-div'),
        error: document.getElementById('login-error')
    };

    if (isLoginMode) {
        elements.title.innerText = "Member Login";
        elements.btn.innerText = "Login";
        elements.btn.onclick = login;
        elements.toggleText.innerText = "Create an account";
        elements.adminDiv.classList.add('hidden');
    } else {
        elements.title.innerText = "Register";
        elements.btn.innerText = "Sign Up";
        elements.btn.onclick = register;
        elements.toggleText.innerText = "Back to Login";
        elements.adminDiv.classList.remove('hidden');
    }
    elements.error.innerText = "";
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            initDashboard();
        } else {
            document.getElementById('login-error').innerText = data.message;
        }
    } catch (err) {
        console.error("Login Error:", err);
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const isAdmin = document.getElementById('isAdmin').checked;
    const role = isAdmin ? 'admin' : 'user';

    if (!username || !password) return alert("All fields required");

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
    });
    const data = await res.json();
    
    if (data.success) {
        alert(data.message);
        toggleAuth(); // Reset to login screen
    } else {
        document.getElementById('login-error').innerText = data.message;
    }
}

function logout() {
    location.reload();
}

function initDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = `Welcome, ${currentUser.username}`;
    
    loadBooks();

    if (currentUser.role === 'admin') {
        document.getElementById('admin-panel').classList.remove('hidden');
        loadStats();
        loadUsers();
    } else {
        document.getElementById('user-panel').classList.remove('hidden');
        loadMyBooks();
        checkNotifications();
    }
}

// ================= CATALOG & BOOKS =================

async function loadBooks() {
    const search = document.getElementById('searchQuery').value || '';
    const category = document.getElementById('categoryFilter').value || 'All';

    const res = await fetch(`/api/books?search=${search}&category=${category}`);
    const books = await res.json();
    const list = document.getElementById('book-list');
    list.innerHTML = '';

    if (books.length === 0) {
        list.innerHTML = '<p class="empty-state">No books found matching criteria.</p>';
        return;
    }

    books.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-card';
        
        let actionBtns = '';
        if (currentUser.role === 'admin') {
            actionBtns = `
                <div class="action-row">
                    <button class="btn-warn" onclick="setupEdit(${book.id}, '${book.title}', '${book.author}', '${book.category}', ${book.quantity})">Edit</button>
                    <button class="btn-danger" onclick="deleteBook(${book.id})">Delete</button>
                </div>
            `;
        } else if (book.quantity > 0) {
            actionBtns = `<button class="btn-primary full-width" onclick="borrowBook(${book.id})">Borrow</button>`;
        } else {
            actionBtns = `<button class="btn-disabled full-width" disabled>Out of Stock</button>`;
        }
        
        div.innerHTML = `
            <div class="book-info">
                <h4>${book.title}</h4>
                <p class="meta">${book.author} &bull; ${book.category}</p>
                <p class="stock">Available: ${book.quantity}</p>
            </div>
            ${actionBtns}
        `;
        list.appendChild(div);
    });
}

async function borrowBook(bookId) {
    const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, book_id: bookId })
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) {
        loadBooks();
        loadMyBooks();
    }
}

async function loadMyBooks() {
    const res = await fetch(`/api/mybooks/${currentUser.id}`);
    const books = await res.json();
    const list = document.getElementById('my-books-list');
    list.innerHTML = '';

    books.forEach(b => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
            <span><strong>${b.title}</strong> <small>(Due: ${new Date(b.due_date).toLocaleDateString()})</small></span>
            <button onclick="returnBook(${b.book_id})" class="btn-warn">Return</button>
        `;
        list.appendChild(li);
    });
}

async function returnBook(bookId) {
    if (!confirm("Confirm return of this book?")) return;
    const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, book_id: bookId })
    });
    const data = await res.json();
    alert(data.message);
    loadMyBooks();
    loadBooks();
}

async function checkNotifications() {
    const res = await fetch(`/api/notifications/${currentUser.id}`);
    const data = await res.json();
    if (data[0].count > 0) {
        const banner = document.getElementById('notification-area');
        banner.classList.remove('hidden');
        banner.innerHTML = `<strong>Attention:</strong> You have ${data[0].count} item(s) due within 3 days.`;
    }
}

// ================= ADMIN FUNCTIONS =================

async function addBook() {
    const data = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        category: document.getElementById('bookCategory').value,
        quantity: document.getElementById('bookQty').value
    };

    if (editingBookId) {
        updateBook(data);
        return;
    }

    await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    alert('Inventory Updated');
    resetForm();
    loadBooks();
}

async function updateBook(data) {
    await fetch(`/api/books/${editingBookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    alert('Details Updated');
    resetForm();
    loadBooks();
}

async function deleteBook(id) {
    if (!confirm('Permanently remove this book?')) return;
    await fetch(`/api/books/${id}`, { method: 'DELETE' });
    loadBooks();
}

function setupEdit(id, title, author, category, quantity) {
    editingBookId = id;
    document.getElementById('bookTitle').value = title;
    document.getElementById('bookAuthor').value = author;
    document.getElementById('bookCategory').value = category;
    document.getElementById('bookQty').value = quantity;

    const btn = document.getElementById('add-book-btn');
    btn.innerText = "Update Item";
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    editingBookId = null;
    document.querySelectorAll('.form-panel input').forEach(i => i.value = '');
    document.getElementById('add-book-btn').innerText = "Add Book";
    document.getElementById('cancel-edit-btn').classList.add('hidden');
}

async function loadStats() {
    const res = await fetch('/api/admin/stats');
    const stats = await res.json();
    document.getElementById('stat-borrowed').innerText = stats.borrowed;
    document.getElementById('stat-returned').innerText = stats.returned;
    document.getElementById('stat-overdue').innerText = stats.overdue;
}

async function loadUsers() {
    const res = await fetch('/api/users');
    const users = await res.json();
    const list = document.getElementById('user-list');
    list.innerHTML = '';

    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'list-item';
        const deleteBtn = (user.id === currentUser.id) ? '<span class="badge">Me</span>' : 
            `<button class="btn-danger small" onclick="deleteUser(${user.id})">Remove</button>`;

        li.innerHTML = `<span>${user.username} <small>(${user.role})</small></span> ${deleteBtn}`;
        list.appendChild(li);
    });
}

async function deleteUser(id) {
    if (!confirm("This action cannot be undone. Proceed?")) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    loadUsers();
}