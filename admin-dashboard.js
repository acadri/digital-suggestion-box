document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeDashboard();
});

/* Helper to escape HTML inserted from user-generated content */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function checkAdminAuth() {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
        window.location.href = 'admin-login.html';
        return;
    }

    const user = JSON.parse(adminUser);
    document.getElementById('adminName').textContent = `Welcome, ${user.name || user.email}`;
}

function initializeDashboard() {
    loadSuggestions();
    setupEventListeners();
    updateStats();
}

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        auth.signOut().then(() => {
            localStorage.removeItem('adminUser');
            window.location.href = 'admin-login.html';
        });
    });

    // Filters
    document.getElementById('statusFilter').addEventListener('change', loadSuggestions);
    document.getElementById('departmentFilter').addEventListener('change', loadSuggestions);
    document.getElementById('clearFilters').addEventListener('click', function() {
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('departmentFilter').value = 'all';
        loadSuggestions();
    });

    // Modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('responseForm').addEventListener('submit', handleResponseSubmit);

    // Character counter for response
    document.getElementById('adminResponse').addEventListener('input', function() {
        const count = this.value.length;
        document.getElementById('responseCharCount').textContent = count;
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('responseModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

function loadSuggestions() {
    const statusFilter = document.getElementById('statusFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    
    let query = db.collection(SUGGESTIONS_COLLECTION).orderBy('timestamp', 'desc');

    if (statusFilter !== 'all') {
        query = query.where('status', '==', statusFilter);
    }

    if (departmentFilter !== 'all') {
        query = query.where('department', '==', departmentFilter);
    }

    query.get().then((querySnapshot) => {
        const suggestions = [];
        querySnapshot.forEach((doc) => {
            suggestions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        displaySuggestions(suggestions);
    }).catch((error) => {
        console.error('Error loading suggestions: ', error);
    });
}

function displaySuggestions(suggestions) {
    const container = document.getElementById('suggestionsList');
    
    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="no-suggestions">
                <i class="fas fa-inbox"></i>
                <h3>No Suggestions Found</h3>
                <p>No suggestions match your current filters.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = suggestions.map(suggestion => `
        <div class="admin-suggestion-card">
            <div class="suggestion-main">
                <div class="suggestion-header">
                    <span class="suggestion-department">
                        <i class="fas fa-building"></i>
                        ${escapeHtml(suggestion.department || '')}
                    </span>
                    <span class="suggestion-category">${escapeHtml(suggestion.tag || '')}</span>
                    <span class="suggestion-status status-${(suggestion.status || '').toLowerCase().replace(/\s+/g, '')}">
                        ${escapeHtml(suggestion.status || '')}
                    </span>
                </div>
                <div class="suggestion-text">
                    ${escapeHtml(suggestion.suggestion_text || '')}
                </div>
                <div class="suggestion-footer">
                    <span class="suggestion-date">
                        <i class="far fa-clock"></i>
                        ${new Date(suggestion.timestamp).toLocaleDateString()}
                    </span>
                    <button class="response-btn" data-suggestion-id="${suggestion.id}">
                        <i class="fas fa-reply"></i>
                        Respond
                    </button>
                </div>
            </div>
            ${suggestion.adminResponse ? `
                <div class="existing-response">
                    <div class="response-header">
                        <i class="fas fa-user-shield"></i>
                        <strong>Your Previous Response</strong>
                    </div>
                    <div class="response-content">
                        ${escapeHtml(suggestion.adminResponse)}
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');

    // Add event listeners to response buttons
    document.querySelectorAll('.response-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const suggestionId = this.getAttribute('data-suggestion-id');
            openResponseModal(suggestionId);
        });
    });
}

function openResponseModal(suggestionId) {
    const modal = document.getElementById('responseModal');
    const suggestionDetails = document.getElementById('suggestionDetails');
    
    // Get suggestion details
    db.collection(SUGGESTIONS_COLLECTION).doc(suggestionId).get()
        .then((doc) => {
            if (doc.exists) {
                const suggestion = doc.data();
                suggestionDetails.innerHTML = `
                    <div class="suggestion-detail-item">
                            <strong>Department:</strong> ${escapeHtml(suggestion.department || '')}
                        </div>
                        <div class="suggestion-detail-item">
                            <strong>Category:</strong> ${escapeHtml(suggestion.tag || '')}
                        </div>
                        <div class="suggestion-detail-item">
                            <strong>Current Status:</strong> 
                            <span class="status-${(suggestion.status || '').toLowerCase().replace(/\s+/g, '')}">
                                ${escapeHtml(suggestion.status || '')}
                            </span>
                        </div>
                        <div class="suggestion-detail-item">
                            <strong>Suggestion:</strong>
                            <p>${escapeHtml(suggestion.suggestion_text || '')}</p>
                        </div>
                `;
                
                // Set current status in dropdown
                document.getElementById('responseStatus').value = suggestion.status;
                
                // Store suggestion ID in form
                document.getElementById('responseForm').setAttribute('data-suggestion-id', suggestionId);
                
                modal.style.display = 'block';
            }
        })
        .catch((error) => {
            console.error('Error loading suggestion: ', error);
            alert('Error loading suggestion details');
        });
}

function closeModal() {
    document.getElementById('responseModal').style.display = 'none';
    document.getElementById('responseForm').reset();
    document.getElementById('responseCharCount').textContent = '0';
}

function handleResponseSubmit(e) {
    e.preventDefault();
    
    const suggestionId = e.target.getAttribute('data-suggestion-id');
    const status = document.getElementById('responseStatus').value;
    const response = document.getElementById('adminResponse').value;
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));
    
    if (!response.trim()) {
        alert('Please provide a response');
        return;
    }

    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    const responseData = {
        suggestionId: suggestionId,
        status: status,
        response: response,
        adminId: adminUser.uid,
        adminName: adminUser.name || adminUser.email,
        timestamp: new Date().toISOString()
    };

    // Save response and update suggestion status
    Promise.all([
        db.collection(ADMIN_RESPONSES_COLLECTION).add(responseData),
        db.collection(SUGGESTIONS_COLLECTION).doc(suggestionId).update({
            status: status,
            lastUpdated: new Date().toISOString()
        })
    ]).then(() => {
        alert('Response submitted successfully!');
        closeModal();
        loadSuggestions();
        updateStats();
    }).catch((error) => {
        console.error('Error submitting response: ', error);
        alert('Error submitting response. Please try again.');
    }).finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function updateStats() {
    // Implement stats calculation similar to updateHeroStats but for admin dashboard
    // This would update the stat cards in the admin dashboard
}

// Add this function to admin-dashboard.js
async function updateStats() {
    try {
        const suggestionsSnapshot = await db.collection(SUGGESTIONS_COLLECTION).get();
        const responsesSnapshot = await db.collection(ADMIN_RESPONSES_COLLECTION).get();
        
        const total = suggestionsSnapshot.size;
        const pending = suggestionsSnapshot.docs.filter(doc => 
            doc.data().status === 'New' || doc.data().status === 'Under Review'
        ).length;
        const resolved = suggestionsSnapshot.docs.filter(doc => 
            doc.data().status === 'Resolved'
        ).length;
        
        // Count suggestions with responses
        const suggestionIdsWithResponses = new Set();
        responsesSnapshot.forEach(doc => {
            suggestionIdsWithResponses.add(doc.data().suggestionId);
        });
        const withResponses = suggestionIdsWithResponses.size;

        document.getElementById('totalSuggestions').textContent = total;
        document.getElementById('pendingSuggestions').textContent = pending;
        document.getElementById('resolvedSuggestions').textContent = resolved;
        document.getElementById('withResponses').textContent = withResponses;
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}