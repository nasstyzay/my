// Data Storage
let piggyBanks = JSON.parse(localStorage.getItem('piggyBanks')) || [];
let currentPiggyId = null;
let currentEditPiggyId = null;

// Filter and Sort State
let searchQuery = '';
let sortBy = 'name-asc';

// Category Icons and Colors - Enhanced with better visual icons
const categoryData = {
    vacation: { icon: '✈️', name: 'Vacation/Travel' },
    food: { icon: '🍽️', name: 'Food & Dining' },
    transportation: { icon: '🚗', name: 'Transportation' },
    entertainment: { icon: '🎬', name: 'Entertainment' },
    education: { icon: '🎓', name: 'Education' },
    shopping: { icon: '🛒', name: 'Shopping' }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    recalculateAllTotals();
    renderSummaryCard();
    renderDashboard();
    setupEventListeners();
});

// Recalculate all piggy bank totals from transactions
function recalculateAllTotals() {
    piggyBanks.forEach(piggy => {
        piggy.total = piggy.transactions.reduce((sum, t) => sum + t.amount, 0);
    });
    savePiggyBanks();
}

// Calculate grand total across all piggy banks
function calculateGrandTotal() {
    return piggyBanks.reduce((sum, piggy) => sum + piggy.total, 0);
}

// Calculate total number of transactions
function calculateTotalTransactions() {
    return piggyBanks.reduce((sum, piggy) => sum + piggy.transactions.length, 0);
}

// Find most used category
function getMostUsedCategory() {
    if (piggyBanks.length === 0) return null;
    
    const categoryCounts = {};
    piggyBanks.forEach(piggy => {
        categoryCounts[piggy.category] = (categoryCounts[piggy.category] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostUsed = null;
    for (const [category, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostUsed = category;
        }
    }
    
    return mostUsed;
}

// Format currency with 2 decimal places
function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

// Render Summary Card
function renderSummaryCard() {
    const summaryContainer = document.getElementById('summaryCards');
    if (!summaryContainer) return;
    
    const grandTotal = calculateGrandTotal();
    const totalTransactions = calculateTotalTransactions();
    const mostUsedCategory = getMostUsedCategory();
    const mostUsedInfo = mostUsedCategory ? categoryData[mostUsedCategory] : null;
    
    summaryContainer.innerHTML = `
        <div class="summary-card">
            <div class="summary-icon">💰</div>
            <div class="summary-info">
                <div class="summary-label">Total Balance</div>
                <div class="summary-value">${formatCurrency(grandTotal)}</div>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon">🏦</div>
            <div class="summary-info">
                <div class="summary-label">Piggy Banks</div>
                <div class="summary-value">${piggyBanks.length}</div>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon">📊</div>
            <div class="summary-info">
                <div class="summary-label">Total Transactions</div>
                <div class="summary-value">${totalTransactions}</div>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon">${mostUsedInfo ? mostUsedInfo.icon : '📁'}</div>
            <div class="summary-info">
                <div class="summary-label">Most Used</div>
                <div class="summary-value">${mostUsedInfo ? mostUsedInfo.name : 'None'}</div>
            </div>
        </div>
    `;
}

// Setup Event Listeners
function setupEventListeners() {
    // Add New Piggy Bank Button
    document.getElementById('btnAddNew').addEventListener('click', () => {
        openModal('addModal');
    });

    // Close Modals
    document.getElementById('btnCloseModal').addEventListener('click', () => {
        closeModal('addModal');
    });

    document.getElementById('btnCloseTransaction').addEventListener('click', () => {
        closeModal('transactionModal');
    });

    // Cancel Button
    document.getElementById('btnCancel').addEventListener('click', () => {
        closeModal('addModal');
    });

    // Create Piggy Bank
    document.getElementById('btnCreate').addEventListener('click', createPiggyBank);

    // Add Transaction
    document.getElementById('btnAddTransaction').addEventListener('click', addTransaction);

    // Close modal on outside click
    document.getElementById('addModal').addEventListener('click', (e) => {
        if (e.target.id === 'addModal') {
            closeModal('addModal');
        }
    });

    document.getElementById('transactionModal').addEventListener('click', (e) => {
        if (e.target.id === 'transactionModal') {
            closeModal('transactionModal');
        }
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderDashboard();
    });

    // Sort select
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderDashboard();
    });

    // Data controls button
    document.getElementById('btnDataControls').addEventListener('click', () => {
        openModal('dataModal');
    });

    // Close data modal
    document.getElementById('btnCloseData').addEventListener('click', () => {
        closeModal('dataModal');
    });

    // Export data
    document.getElementById('btnExportData').addEventListener('click', exportData);

    // Import data
    document.getElementById('btnImportData').addEventListener('click', () => {
        document.getElementById('fileImport').click();
    });

    document.getElementById('fileImport').addEventListener('change', importData);

    // Clear data
    document.getElementById('btnClearData').addEventListener('click', clearAllData);

    // Edit modal close
    document.getElementById('btnCloseEdit').addEventListener('click', () => {
        closeModal('editModal');
    });

    // Save edit
    document.getElementById('btnSaveEdit').addEventListener('click', saveEditPiggy);

    // Delete piggy
    document.getElementById('btnDeletePiggy').addEventListener('click', deletePiggyBank);

    // Close modals on outside click
    document.getElementById('dataModal').addEventListener('click', (e) => {
        if (e.target.id === 'dataModal') {
            closeModal('dataModal');
        }
    });

    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') {
            closeModal('editModal');
        }
    });
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    
    // Focus management for accessibility
    const firstInput = modal.querySelector('input, select, button');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Trap focus within modal
    modal.addEventListener('keydown', trapFocus);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    modal.removeEventListener('keydown', trapFocus);
    
    if (modalId === 'addModal') {
        document.getElementById('piggyName').value = '';
        document.getElementById('piggyCategory').value = 'vacation';
    }
}

// Trap focus within modal for accessibility
function trapFocus(e) {
    if (e.key !== 'Tab') return;
    
    const modal = e.currentTarget;
    const focusableElements = modal.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
    }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// Create Piggy Bank
function createPiggyBank() {
    const name = document.getElementById('piggyName').value.trim();
    const category = document.getElementById('piggyCategory').value;

    if (!name) {
        alert('Please enter a piggy bank name');
        return;
    }

    const newPiggy = {
        id: Date.now(),
        name: name,
        category: category,
        total: 0.00,
        transactions: []
    };

    piggyBanks.push(newPiggy);
    savePiggyBanks();
    renderSummaryCard();
    renderDashboard();
    closeModal('addModal');
}

// Render Dashboard
function renderDashboard() {
    const dashboard = document.getElementById('dashboard');
    
    if (piggyBanks.length === 0) {
        dashboard.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🐷</div>
                <h2 style="color: white; margin-bottom: 10px;">No piggy banks yet!</h2>
                <p style="color: rgba(255,255,255,0.8);">Click "Add New Piggy Bank" to create your first savings goal</p>
            </div>
        `;
        return;
    }

    // Filter by search query
    let filteredPiggyBanks = piggyBanks.filter(piggy => 
        piggy.name.toLowerCase().includes(searchQuery)
    );

    // Sort piggy banks
    filteredPiggyBanks.sort((a, b) => {
        switch(sortBy) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'amount-desc':
                return b.total - a.total;
            case 'amount-asc':
                return a.total - b.total;
            default:
                return 0;
        }
    });

    if (filteredPiggyBanks.length === 0) {
        dashboard.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                <h2 style="color: white; margin-bottom: 10px;">No piggy banks found</h2>
                <p style="color: rgba(255,255,255,0.8);">Try a different search term</p>
            </div>
        `;
        return;
    }

    dashboard.innerHTML = filteredPiggyBanks.map(piggy => {
        const categoryInfo = categoryData[piggy.category];
        const transactionCount = piggy.transactions.length;
        return `
            <div class="piggy-card ${piggy.category}">
                <div class="piggy-icon">${categoryInfo.icon}</div>
                <div class="piggy-name">${piggy.name}</div>
                <div class="piggy-category">${categoryInfo.name}</div>
                <div class="piggy-amount">${formatCurrency(piggy.total)}</div>
                <p style="color: #888; font-size: 0.85rem; margin-top: 10px;">
                    ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''}
                </p>
                <div class="card-actions">
                    <button class="btn-card-action" onclick="event.stopPropagation(); openEditPiggy(${piggy.id})" title="Edit">✏️</button>
                    <button class="btn-card-action" onclick="event.stopPropagation(); goToDetail(${piggy.id})" title="View Details">👁️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Navigate to detail page
function goToDetail(piggyId) {
    window.location.href = `detail.html?id=${piggyId}`;
}

// Open Piggy Details
function openPiggyDetails(piggyId) {
    currentPiggyId = piggyId;
    const piggy = piggyBanks.find(p => p.id === piggyId);
    
    if (!piggy) return;

    document.getElementById('transactionTitle').textContent = piggy.name;
    document.getElementById('totalAmount').textContent = `$${piggy.total.toFixed(2)}`;
    document.getElementById('transactionCount').textContent = piggy.transactions.length;

    renderTransactions(piggy);
    openModal('transactionModal');
}

// Render Transactions
function renderTransactions(piggy) {
    const transactionsList = document.getElementById('transactionsList');
    
    if (piggy.transactions.length === 0) {
        transactionsList.innerHTML = '<p class="empty-state">No transactions yet. Add your first transaction above!</p>';
        return;
    }

    // Sort transactions by date (newest first)
    const sortedTransactions = [...piggy.transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    transactionsList.innerHTML = sortedTransactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-note">${transaction.note || 'No description'}</div>
                <div class="transaction-date">${formatDate(transaction.date)}</div>
            </div>
            <div class="transaction-amount">${formatCurrency(transaction.amount)}</div>
            <button class="btn-delete" onclick="deleteTransaction(${piggy.id}, ${transaction.id})">Delete</button>
        </div>
    `).join('');
}

// Add Transaction
function addTransaction() {
    const amountInput = document.getElementById('transactionAmount');
    const amount = parseFloat(amountInput.value);
    const note = document.getElementById('transactionNote').value.trim();

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

    const piggy = piggyBanks.find(p => p.id === currentPiggyId);
    if (!piggy) return;

    const newTransaction = {
        id: Date.now(),
        amount: parseFloat(amount.toFixed(2)),
        note: note || 'No description',
        date: new Date().toISOString()
    };

    piggy.transactions.push(newTransaction);
    piggy.total = parseFloat((piggy.total + newTransaction.amount).toFixed(2));

    savePiggyBanks();
    
    // Update display
    document.getElementById('totalAmount').textContent = formatCurrency(piggy.total);
    document.getElementById('transactionCount').textContent = piggy.transactions.length;
    renderTransactions(piggy);
    renderSummaryCard();
    renderDashboard();

    // Clear form
    amountInput.value = '';
    document.getElementById('transactionNote').value = '';
    amountInput.focus();
}

// Delete Transaction
function deleteTransaction(piggyId, transactionId) {
    if (!confirm('🗑️ Are you sure you want to delete this transaction?\n\nThis action cannot be undone.')) {
        return;
    }

    const piggy = piggyBanks.find(p => p.id === piggyId);
    if (!piggy) return;

    const transaction = piggy.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Remove transaction and recalculate total
    piggy.transactions = piggy.transactions.filter(t => t.id !== transactionId);
    piggy.total = piggy.transactions.reduce((sum, t) => sum + t.amount, 0);
    piggy.total = parseFloat(piggy.total.toFixed(2));

    savePiggyBanks();
    
    // Update display
    document.getElementById('totalAmount').textContent = formatCurrency(piggy.total);
    document.getElementById('transactionCount').textContent = piggy.transactions.length;
    renderTransactions(piggy);
    renderSummaryCard();
    renderDashboard();
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Save to LocalStorage
function savePiggyBanks() {
    localStorage.setItem('piggyBanks', JSON.stringify(piggyBanks));
}

// Export Data
function exportData() {
    const dataStr = JSON.stringify(piggyBanks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `savings-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Data exported successfully!');
}

// Import Data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedData)) {
                alert('⚠️ Invalid file format. Please select a valid backup file.');
                return;
            }

            if (confirm('⚠️ This will replace all current data. Continue?')) {
                piggyBanks = importedData;
                savePiggyBanks();
                recalculateAllTotals();
                renderSummaryCard();
                renderDashboard();
                closeModal('dataModal');
                alert('✅ Data imported successfully!');
            }
        } catch (error) {
            alert('⚠️ Error reading file. Please select a valid JSON file.');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Clear All Data
function clearAllData() {
    if (!confirm('🗑️ Are you sure you want to delete ALL piggy banks and transactions?\n\nThis action cannot be undone!')) {
        return;
    }

    if (!confirm('⚠️ FINAL WARNING: This will permanently delete everything. Are you absolutely sure?')) {
        return;
    }

    piggyBanks = [];
    savePiggyBanks();
    renderSummaryCard();
    renderDashboard();
    closeModal('dataModal');
    alert('✅ All data has been cleared.');
}

// Open Edit Piggy Modal
function openEditPiggy(piggyId) {
    currentEditPiggyId = piggyId;
    const piggy = piggyBanks.find(p => p.id === piggyId);
    if (!piggy) return;

    document.getElementById('editPiggyName').value = piggy.name;
    document.getElementById('editPiggyCategory').value = piggy.category;
    openModal('editModal');
}

// Save Edit Piggy
function saveEditPiggy() {
    const name = document.getElementById('editPiggyName').value.trim();
    const category = document.getElementById('editPiggyCategory').value;

    if (!name) {
        alert('⚠️ Please enter a piggy bank name');
        return;
    }

    const piggy = piggyBanks.find(p => p.id === currentEditPiggyId);
    if (!piggy) return;

    piggy.name = name;
    piggy.category = category;

    savePiggyBanks();
    renderSummaryCard();
    renderDashboard();
    closeModal('editModal');
    alert('✅ Piggy bank updated successfully!');
}

// Delete Piggy Bank
function deletePiggyBank() {
    if (!confirm('🗑️ Are you sure you want to delete this piggy bank?\n\nAll transactions will be permanently deleted. This action cannot be undone.')) {
        return;
    }

    piggyBanks = piggyBanks.filter(p => p.id !== currentEditPiggyId);
    savePiggyBanks();
    renderSummaryCard();
    renderDashboard();
    closeModal('editModal');
    alert('✅ Piggy bank deleted successfully.');
}
