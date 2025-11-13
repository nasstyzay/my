// Get piggy bank ID from URL
const urlParams = new URLSearchParams(window.location.search);
const piggyId = parseInt(urlParams.get('id'));

// Load data from localStorage
let piggyBanks = JSON.parse(localStorage.getItem('piggyBanks')) || [];
let currentPiggy = piggyBanks.find(p => p.id === piggyId);

// Filter and Edit State
let filterStartDate = null;
let filterEndDate = null;
let currentEditTransactionId = null;

// Category data with enhanced icons
const categoryData = {
    vacation: { icon: '✈️', name: 'Vacation/Travel' },
    food: { icon: '🍽️', name: 'Food & Dining' },
    transportation: { icon: '🚗', name: 'Transportation' },
    entertainment: { icon: '🎬', name: 'Entertainment' },
    education: { icon: '🎓', name: 'Education' },
    shopping: { icon: '🛒', name: 'Shopping' }
};

// Format currency with 2 decimal places
function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!currentPiggy) {
        alert('Piggy bank not found!');
        window.location.href = 'index.html';
        return;
    }

    // Recalculate total from transactions
    currentPiggy.total = currentPiggy.transactions.reduce((sum, t) => sum + t.amount, 0);
    currentPiggy.total = parseFloat(currentPiggy.total.toFixed(2));
    
    // Update localStorage
    const piggyIndex = piggyBanks.findIndex(p => p.id === piggyId);
    if (piggyIndex !== -1) {
        piggyBanks[piggyIndex] = currentPiggy;
        localStorage.setItem('piggyBanks', JSON.stringify(piggyBanks));
    }

    // Set today's date as default
    document.getElementById('expenseDate').valueAsDate = new Date();

    loadPiggyDetails();
    renderExpenses();

    // Date filter event listeners
    document.getElementById('filterStartDate').addEventListener('change', (e) => {
        filterStartDate = e.target.value ? new Date(e.target.value) : null;
        renderExpenses();
    });

    document.getElementById('filterEndDate').addEventListener('change', (e) => {
        filterEndDate = e.target.value ? new Date(e.target.value) : null;
        renderExpenses();
    });

    document.getElementById('btnClearFilter').addEventListener('click', () => {
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        filterStartDate = null;
        filterEndDate = null;
        renderExpenses();
    });

    // Edit transaction modal
    document.getElementById('btnCloseEditTransaction').addEventListener('click', () => {
        closeModal('editTransactionModal');
    });

    document.getElementById('btnSaveTransaction').addEventListener('click', saveEditTransaction);

    document.getElementById('editTransactionModal').addEventListener('click', (e) => {
        if (e.target.id === 'editTransactionModal') {
            closeModal('editTransactionModal');
        }
    });
});

// Load piggy bank details
function loadPiggyDetails() {
    const header = document.getElementById('detailHeader');
    header.className = `detail-header ${currentPiggy.category}`;

    document.getElementById('detailPiggyName').textContent = currentPiggy.name;
    document.getElementById('detailTotal').textContent = formatCurrency(currentPiggy.total);
    document.getElementById('transactionCountDetail').textContent = currentPiggy.transactions.length;

    // Update progress bar (example: show progress based on transaction count)
    const progressPercent = Math.min((currentPiggy.transactions.length / 10) * 100, 100);
    document.getElementById('progressBar').style.width = `${progressPercent}%`;
}

// Show success notification
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add expense
function addExpense() {
    const amountInput = document.getElementById('expenseAmount');
    const amount = parseFloat(amountInput.value);
    const description = document.getElementById('expenseDescription').value.trim();
    const date = document.getElementById('expenseDate').value;

    // Validation
    if (!amountInput.value || amountInput.value.trim() === '') {
        alert('⚠️ Please enter an amount');
        amountInput.focus();
        return;
    }

    if (isNaN(amount)) {
        alert('⚠️ Please enter a valid number');
        amountInput.focus();
        return;
    }

    if (amount <= 0) {
        alert('⚠️ Amount must be greater than zero');
        amountInput.focus();
        return;
    }

    if (amount > 999999.99) {
        alert('⚠️ Amount is too large (max: $999,999.99)');
        amountInput.focus();
        return;
    }

    if (!date) {
        alert('⚠️ Please select a date');
        document.getElementById('expenseDate').focus();
        return;
    }

    const newExpense = {
        id: Date.now(),
        amount: parseFloat(amount.toFixed(2)),
        note: description || 'No description',
        date: new Date(date).toISOString()
    };

    currentPiggy.transactions.push(newExpense);
    currentPiggy.total = parseFloat((currentPiggy.total + newExpense.amount).toFixed(2));

    // Update localStorage
    const piggyIndex = piggyBanks.findIndex(p => p.id === piggyId);
    if (piggyIndex !== -1) {
        piggyBanks[piggyIndex] = currentPiggy;
        localStorage.setItem('piggyBanks', JSON.stringify(piggyBanks));
    }

    // Update display
    loadPiggyDetails();
    renderExpenses();

    // Clear form
    amountInput.value = '';
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseDate').valueAsDate = new Date();

    // Show success notification
    showSuccessNotification(`Expense added: ${formatCurrency(newExpense.amount)}`);

    // Focus on amount field
    amountInput.focus();
}

// Render expenses
function renderExpenses() {
    const container = document.getElementById('expenseListContainer');

    if (currentPiggy.transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No expenses yet. Add your first expense above!</p>';
        return;
    }

    // Filter by date range
    let filteredExpenses = [...currentPiggy.transactions];
    
    if (filterStartDate || filterEndDate) {
        filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            expenseDate.setHours(0, 0, 0, 0);
            
            if (filterStartDate && filterEndDate) {
                const start = new Date(filterStartDate);
                const end = new Date(filterEndDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return expenseDate >= start && expenseDate <= end;
            } else if (filterStartDate) {
                const start = new Date(filterStartDate);
                start.setHours(0, 0, 0, 0);
                return expenseDate >= start;
            } else if (filterEndDate) {
                const end = new Date(filterEndDate);
                end.setHours(23, 59, 59, 999);
                return expenseDate <= end;
            }
            return true;
        });
    }

    if (filteredExpenses.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions found in this date range.</p>';
        return;
    }

    // Sort by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = filteredExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-date">${formatDate(expense.date)}</div>
            <div class="expense-description">${expense.note}</div>
            <div class="expense-amount">${formatCurrency(expense.amount)}</div>
            <div class="expense-actions">
                <button class="btn-edit" onclick="openEditTransaction(${expense.id})">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteExpense(${expense.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete expense
function deleteExpense(expenseId) {
    if (!confirm('🗑️ Are you sure you want to delete this expense?\n\nThis action cannot be undone.')) {
        return;
    }

    const expense = currentPiggy.transactions.find(t => t.id === expenseId);
    if (!expense) return;

    // Remove transaction and recalculate total
    currentPiggy.transactions = currentPiggy.transactions.filter(t => t.id !== expenseId);
    currentPiggy.total = currentPiggy.transactions.reduce((sum, t) => sum + t.amount, 0);
    currentPiggy.total = parseFloat(currentPiggy.total.toFixed(2));

    // Update localStorage
    const piggyIndex = piggyBanks.findIndex(p => p.id === piggyId);
    if (piggyIndex !== -1) {
        piggyBanks[piggyIndex] = currentPiggy;
        localStorage.setItem('piggyBanks', JSON.stringify(piggyBanks));
    }

    // Update display
    loadPiggyDetails();
    renderExpenses();
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Go back to dashboard
function goBack() {
    window.location.href = 'index.html';
}

// Allow Enter key to submit form
document.addEventListener('keypress', (e) => {
    if (e.target.id !== 'expenseDescription' && e.target.id !== 'editTransactionDescription') {
        if (e.key === 'Enter') {
            if (document.getElementById('editTransactionModal').classList.contains('active')) {
                saveEditTransaction();
            } else {
                addExpense();
            }
        }
    }
});

// Open Edit Transaction Modal
function openEditTransaction(transactionId) {
    currentEditTransactionId = transactionId;
    const transaction = currentPiggy.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    document.getElementById('editTransactionAmount').value = transaction.amount;
    document.getElementById('editTransactionDescription').value = transaction.note;
    document.getElementById('editTransactionDate').value = new Date(transaction.date).toISOString().split('T')[0];
    
    openModal('editTransactionModal');
}

// Save Edit Transaction
function saveEditTransaction() {
    const amountInput = document.getElementById('editTransactionAmount');
    const amount = parseFloat(amountInput.value);
    const description = document.getElementById('editTransactionDescription').value.trim();
    const date = document.getElementById('editTransactionDate').value;

    // Validation
    if (!amountInput.value || amountInput.value.trim() === '') {
        alert('⚠️ Please enter an amount');
        amountInput.focus();
        return;
    }

    if (isNaN(amount)) {
        alert('⚠️ Please enter a valid number');
        amountInput.focus();
        return;
    }

    if (amount <= 0) {
        alert('⚠️ Amount must be greater than zero');
        amountInput.focus();
        return;
    }

    if (amount > 999999.99) {
        alert('⚠️ Amount is too large (max: $999,999.99)');
        amountInput.focus();
        return;
    }

    if (!date) {
        alert('⚠️ Please select a date');
        document.getElementById('editTransactionDate').focus();
        return;
    }

    const transaction = currentPiggy.transactions.find(t => t.id === currentEditTransactionId);
    if (!transaction) return;

    // Update transaction
    transaction.amount = parseFloat(amount.toFixed(2));
    transaction.note = description || 'No description';
    transaction.date = new Date(date).toISOString();

    // Recalculate total
    currentPiggy.total = currentPiggy.transactions.reduce((sum, t) => sum + t.amount, 0);
    currentPiggy.total = parseFloat(currentPiggy.total.toFixed(2));

    // Update localStorage
    const piggyIndex = piggyBanks.findIndex(p => p.id === piggyId);
    if (piggyIndex !== -1) {
        piggyBanks[piggyIndex] = currentPiggy;
        localStorage.setItem('piggyBanks', JSON.stringify(piggyBanks));
    }

    // Update display
    loadPiggyDetails();
    renderExpenses();
    closeModal('editTransactionModal');
    showSuccessNotification('Transaction updated successfully!');
}

// Modal helper functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
