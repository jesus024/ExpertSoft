// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    loadStats();
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
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('customersTableBody').innerHTML = 
            '<tr><td colspan="5" class="error">Error loading customers</td></tr>';
    }
}

// Function to load statistics
async function loadStats() {
    try {
        const [customersRes, totalPaidRes] = await Promise.all([
            fetch('/api/customers'),
            fetch('/api/queries/total-paid')
        ]);
        
        const customers = await customersRes.json();
        const totalPaid = await totalPaidRes.json();
        
        // Calculate statistics
        const totalTransactions = totalPaid.reduce((sum, item) => sum + parseInt(item.total_transactions), 0);
        const pendingInvoices = totalPaid.filter(item => parseFloat(item.total_balance) > 0).length;
        const totalAmount = totalPaid.reduce((sum, item) => sum + parseFloat(item.total_billed), 0);
        
        // Update UI
        document.getElementById('totalCustomers').textContent = customers.length;
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('pendingInvoices').textContent = pendingInvoices;
        document.getElementById('totalAmount').textContent = `$${totalAmount.toLocaleString()}`;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Search functionality
document.getElementById('searchBox').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#customersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Function to load total paid
async function loadTotalPaid() {
    try {
        const response = await fetch('/api/queries/total-paid');
        const data = await response.json();
        
        const resultsDiv = document.getElementById('queryResults');
        resultsDiv.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Total Billed</th>
                            <th>Total Paid</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td><strong>${item.customer_name}</strong></td>
                                <td>${item.email}</td>
                                <td>$${parseFloat(item.total_billed).toLocaleString()}</td>
                                <td>$${parseFloat(item.total_paid).toLocaleString()}</td>
                                <td><span class="status-badge ${parseFloat(item.total_balance) > 0 ? 'status-pending' : 'status-paid'}">
                                    $${parseFloat(item.total_balance).toLocaleString()}
                                </span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('queryResults').innerHTML = '<div class="error">Error loading data</div>';
    }
}

// Function to load pending invoices
async function loadPendingInvoices() {
    try {
        const response = await fetch('/api/queries/pending-invoices');
        const data = await response.json();
        
        const resultsDiv = document.getElementById('queryResults');
        resultsDiv.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Customer</th>
                            <th>Platform</th>
                            <th>Billed Amount</th>
                            <th>Pending Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td><strong>${item.invoice_number}</strong></td>
                                <td>${item.customer_name}</td>
                                <td>${item.platform}</td>
                                <td>$${parseFloat(item.billed_amount).toLocaleString()}</td>
                                <td><span class="status-badge status-pending">$${parseFloat(item.pending_amount).toLocaleString()}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('queryResults').innerHTML = '<div class="error">Error loading data</div>';
    }
}

// Function to load platform transactions
async function loadPlatformTransactions(platform) {
    try {
        const response = await fetch(`/api/queries/platform-transactions/${platform}`);
        const data = await response.json();
        
        const resultsDiv = document.getElementById('queryResults');
        resultsDiv.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td><strong>${item.invoice_number}</strong></td>
                                <td>${item.customer_name}</td>
                                <td>$${parseFloat(item.billed_amount).toLocaleString()}</td>
                                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                                <td>${new Date(item.billing_period).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('queryResults').innerHTML = '<div class="error">Error loading data</div>';
    }
}
