// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    loadStats();
    
    // Add search functionality
    document.getElementById('searchBox').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterCustomers(searchTerm);
    });
});

// Function to load customers
async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        const customers = await response.json();
        
        const tbody = document.getElementById('customersTableBody');
        tbody.innerHTML = '';
        
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${customer.first_name} ${customer.last_name}</strong></td>
                <td>${customer.email}</td>
                <td>${customer.phone}${customer.phone_extension ? ' x' + customer.phone_extension : ''}</td>
                <td>${customer.city || customer.state || 'N/A'}</td>
                <td><span class="status-badge status-paid">Active</span></td>
                <td>
                    <button class="btn btn-secondary" onclick="editCustomer(${customer.id})">Edit</button>
                    <button class="btn btn-warning" onclick="deleteCustomer(${customer.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('customersTableBody').innerHTML = 
            '<tr><td colspan="6" class="error">Error loading customers</td></tr>';
    }
}

// Function to filter customers
function filterCustomers(searchTerm) {
    const rows = document.querySelectorAll('#customersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Function to load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/customers');
        const customers = await response.json();
        
        document.getElementById('totalCustomers').textContent = customers.length;
        
        // For now, we'll set placeholder values for other stats
        // In a real application, these would come from separate API endpoints
        document.getElementById('totalTransactions').textContent = '23';
        document.getElementById('pendingInvoices').textContent = '5';
        document.getElementById('totalAmount').textContent = '$12,450';
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Function to load total paid per customer
async function loadTotalPaid() {
    try {
        const response = await fetch('/api/queries/total-paid');
        const data = await response.json();
        
        const resultsDiv = document.getElementById('queryResults');
        let html = '<h3>💰 Total Paid per Customer</h3>';
        html += '<div class="table-container"><table><thead><tr><th>Customer</th><th>Total Paid</th></tr></thead><tbody>';
        
        data.forEach(item => {
            html += `<tr><td>${item.customer_name}</td><td>$${item.total_paid}</td></tr>`;
        });
        
        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;
        
    } catch (error) {
        document.getElementById('queryResults').innerHTML = 
            '<div class="error">Error loading total paid data</div>';
    }
}

// Function to load pending invoices
async function loadPendingInvoices() {
    try {
        const response = await fetch('/api/queries/pending-invoices');
        const data = await response.json();
        
        const resultsDiv = document.getElementById('queryResults');
        let html = '<h3>⚠️ Pending Invoices</h3>';
        html += '<div class="table-container"><table><thead><tr><th>Customer</th><th>Invoice</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
        
        data.forEach(item => {
            html += `<tr><td>${item.customer_name}</td><td>${item.invoice_number}</td><td>$${item.billed_amount}</td><td><span class="status-badge status-pending">Pending</span></td></tr>`;
        });
        
        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;
        
    } catch (error) {
        document.getElementById('queryResults').innerHTML = 
            '<div class="error">Error loading pending invoices</div>';
    }
}

// Function to load platform transactions
async function loadPlatformTransactions(platform) {
    try {
        const response = await fetch(`/api/queries/platform-transactions/${platform}`);
        const data = await response.json();
        
        const resultsDiv = document.getElementById('queryResults');
        let html = `<h3>📱 ${platform.charAt(0).toUpperCase() + platform.slice(1)} Transactions</h3>`;
        html += '<div class="table-container"><table><thead><tr><th>Customer</th><th>Invoice</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
        
        data.forEach(item => {
            const statusClass = item.status === 'paid' ? 'status-paid' : 
                              item.status === 'pending' ? 'status-pending' : 'status-partial';
            const statusText = item.status === 'paid' ? 'Paid' : 
                             item.status === 'pending' ? 'Pending' : 'Partial';
            
            html += `<tr><td>${item.customer_name}</td><td>${item.invoice_number}</td><td>$${item.billed_amount}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td></tr>`;
        });
        
        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;
        
    } catch (error) {
        document.getElementById('queryResults').innerHTML = 
            '<div class="error">Error loading platform transactions</div>';
    }
}

// Modal functions
function openCustomerModal() {
    document.getElementById('customerModal').style.display = 'block';
    document.getElementById('customerForm').reset();
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

function openCSVModal() {
    document.getElementById('csvModal').style.display = 'block';
    document.getElementById('csvForm').reset();
}

function closeCSVModal() {
    document.getElementById('csvModal').style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const customerModal = document.getElementById('customerModal');
    const csvModal = document.getElementById('csvModal');
    
    if (event.target === customerModal) {
        closeCustomerModal();
    }
    if (event.target === csvModal) {
        closeCSVModal();
    }
}

// Form submission functions
async function submitCustomer(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const customerData = {
        identification_number: formData.get('identification_number'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        street_address: formData.get('street_address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip_code: formData.get('zip_code'),
        phone: formData.get('phone'),
        phone_extension: formData.get('phone_extension'),
        email: formData.get('email')
    };
    
    try {
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
            showAlert('Customer added successfully!', 'success');
            closeCustomerModal();
            loadCustomers();
            loadStats();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error adding customer', 'error');
        }
    } catch (error) {
        showAlert('Error adding customer', 'error');
    }
}

async function submitCSV(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const file = formData.get('csvFile');
    
    if (!file) {
        showAlert('Please select a CSV file', 'error');
        return;
    }
    
    try {
        const uploadData = new FormData();
        uploadData.append('csvFile', file);
        
        const response = await fetch('/api/upload/csv', {
            method: 'POST',
            body: uploadData
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(`CSV processed successfully! ${result.recordsProcessed} records processed.`, 'success');
            closeCSVModal();
            loadCustomers();
            loadStats();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error processing CSV', 'error');
        }
    } catch (error) {
        showAlert('Error processing CSV', 'error');
    }
}

// Customer management functions
async function editCustomer(customerId) {
    try {
        const response = await fetch(`/api/customers/${customerId}`);
        const customer = await response.json();
        
        // Populate form with customer data
        document.getElementById('identification_number').value = customer.identification_number;
        document.getElementById('first_name').value = customer.first_name;
        document.getElementById('last_name').value = customer.last_name;
        document.getElementById('street_address').value = customer.street_address || '';
        document.getElementById('city').value = customer.city || '';
        document.getElementById('state').value = customer.state || '';
        document.getElementById('zip_code').value = customer.zip_code || '';
        document.getElementById('phone').value = customer.phone || '';
        document.getElementById('phone_extension').value = customer.phone_extension || '';
        document.getElementById('email').value = customer.email;
        
        // Change form to update mode
        document.getElementById('customerForm').onsubmit = (e) => updateCustomer(e, customerId);
        document.querySelector('.modal-header h3').textContent = 'Edit Customer';
        document.querySelector('.form-actions button[type="submit"]').textContent = 'Update Customer';
        
        openCustomerModal();
        
    } catch (error) {
        showAlert('Error loading customer data', 'error');
    }
}

async function updateCustomer(event, customerId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const customerData = {
        identification_number: formData.get('identification_number'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        street_address: formData.get('street_address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip_code: formData.get('zip_code'),
        phone: formData.get('phone'),
        phone_extension: formData.get('phone_extension'),
        email: formData.get('email')
    };
    
    try {
        const response = await fetch(`/api/customers/${customerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
            showAlert('Customer updated successfully!', 'success');
            closeCustomerModal();
            loadCustomers();
            loadStats();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error updating customer', 'error');
        }
    } catch (error) {
        showAlert('Error updating customer', 'error');
    }
}

async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/customers/${customerId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Customer deleted successfully!', 'success');
            loadCustomers();
            loadStats();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error deleting customer', 'error');
        }
    } catch (error) {
        showAlert('Error deleting customer', 'error');
    }
}

// Alert function
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        alert.style.background = '#059669';
    } else if (type === 'error') {
        alert.style.background = '#dc2626';
    } else {
        alert.style.background = '#2563eb';
    }
    
    // Add to page
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
