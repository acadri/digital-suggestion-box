// Import Firebase config at the top of your existing script.js
// Make sure to add the Firebase SDK scripts to your index.html

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Defensive checks: warn if Firebase isn't ready
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
        console.warn('Firebase is not initialized. Some features will be disabled.');
    }

    initializeNavigation();
    initializeSuggestionForm();
    initializeFAQ();

    // Load data only if db is available
    if (typeof db !== 'undefined') {
        loadRecentSuggestions();
        updateHeroStats();
    }
}

/* Small helper: escape HTML to avoid XSS when inserting user content into templates */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function initializeNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-navigation');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function() {
        const expanded = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', expanded);
    });
}

function initializeFAQ() {
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', function() {
            const item = this.closest('.faq-item');
            item.classList.toggle('active');
            const toggle = this.querySelector('.faq-toggle');
            toggle.textContent = item.classList.contains('active') ? '−' : '+';
        });
    });
}

function initializeSuggestionForm() {
    const form = document.getElementById('suggestionForm');
    if (!form) return;

    // Char counter
    const suggestionInput = document.getElementById('suggestion');
    const charCount = document.getElementById('charCount');
    const MAX = 500;

    if (suggestionInput && charCount) {
        suggestionInput.addEventListener('input', function() {
            const len = this.value.length;
            charCount.textContent = len;
            if (len > MAX) {
                this.value = this.value.slice(0, MAX);
                charCount.textContent = MAX;
            }
        });
    }

    form.addEventListener('submit', handleSuggestionSubmit);
}

// ... rest of your existing functions remain below ...

function handleSuggestionSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    const formData = new FormData(e.target);
    const suggestion_text_raw = formData.get('suggestion') || '';
    const suggestion = {
        department: (formData.get('department') || '').trim(),
        // store raw text but trimmed; escape when rendering
        suggestion_text: suggestion_text_raw.trim(),
        tag: (formData.get('tag') || '').trim(),
        status: 'New',
        timestamp: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0
    };

    if (!suggestion.department || !suggestion.suggestion_text || !suggestion.tag) {
        alert('Please fill in all fields');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    if (suggestion.suggestion_text.length < 10) {
        alert('Please provide a more detailed suggestion (minimum 10 characters)');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    if (suggestion.suggestion_text.length > 500) {
        alert('Suggestion must be less than 500 characters');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    // Save to Firebase
    if (typeof db === 'undefined') {
        alert('Sorry, the submission service is currently unavailable.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    db.collection(SUGGESTIONS_COLLECTION).add(suggestion)
        .then((docRef) => {
            alert('Thank you! Your suggestion has been submitted successfully. The administration will review it soon.');
            e.target.reset();
            document.getElementById('charCount').textContent = '0';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            loadRecentSuggestions();
            updateHeroStats();
        })
        .catch((error) => {
            console.error('Error adding suggestion: ', error);
            alert('Sorry, there was an error submitting your suggestion. Please try again.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// Update loadRecentSuggestions to use Firebase
function loadRecentSuggestions() {
    db.collection(SUGGESTIONS_COLLECTION)
        .orderBy('timestamp', 'desc')
        .limit(6)
        .get()
        .then((querySnapshot) => {
            const suggestions = [];
            querySnapshot.forEach((doc) => {
                suggestions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            displayRecentSuggestions(suggestions);
        })
        .catch((error) => {
            console.error('Error loading suggestions: ', error);
        });
}

// Update displayRecentSuggestions to make cards expandable
function displayRecentSuggestions(suggestions) {
    const container = document.getElementById('suggestionsPreview');
    if (!container) return;

    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="no-suggestions" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666; font-style: italic;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; color: #ccc;"></i>
                <h3>No Suggestions Yet</h3>
                <p>Be the first to share your ideas and help improve Muni University!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-card expandable" data-suggestion-id="${suggestion.id}">
            <div class="suggestion-header">
                <span class="suggestion-department">
                    <i class="fas fa-building"></i>
                    ${escapeHtml(suggestion.department || '')}
                </span>
                <span class="suggestion-category">${escapeHtml(suggestion.tag || '')}</span>
            </div>
            <div class="suggestion-text">
                ${escapeHtml(suggestion.suggestion_text || '')}
            </div>
            <div class="suggestion-footer">
                <span class="suggestion-date">
                    <i class="far fa-clock"></i>
                    ${new Date(suggestion.timestamp).toLocaleDateString()}
                </span>
                <span class="suggestion-status status-${(suggestion.status || '').toLowerCase().replace(/\s+/g, '')}">
                    ${escapeHtml(suggestion.status || '')}
                </span>
            </div>
            <!-- Admin Response Section (initially hidden) -->
            <div class="admin-response-section" style="display: none;">
                <div class="response-header">
                    <i class="fas fa-user-shield"></i>
                    <strong>Admin Response</strong>
                </div>
                <div class="admin-response-content">
                    Loading response...
                </div>
            </div>
            <div class="expand-indicator">
                <i class="fas fa-chevron-down"></i>
                <span>Click to view admin response</span>
            </div>
        </div>
    `).join('');

    // Add click event listeners to expandable cards
    document.querySelectorAll('.suggestion-card.expandable').forEach(card => {
        card.addEventListener('click', function() {
            const suggestionId = this.getAttribute('data-suggestion-id');
            const responseSection = this.querySelector('.admin-response-section');
            const expandIndicator = this.querySelector('.expand-indicator');
            const icon = expandIndicator.querySelector('i');
            
            if (responseSection.style.display === 'none') {
                // Expand the card
                responseSection.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
                
                // Load admin response if not already loaded
                if (responseSection.querySelector('.admin-response-content').textContent === 'Loading response...') {
                    loadAdminResponse(suggestionId, responseSection);
                }
            } else {
                // Collapse the card
                responseSection.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        });
    });
}

function loadAdminResponse(suggestionId, responseSection) {
    db.collection(ADMIN_RESPONSES_COLLECTION)
        .where('suggestionId', '==', suggestionId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()
        .then((querySnapshot) => {
            const responseContent = responseSection.querySelector('.admin-response-content');
            
                if (querySnapshot.empty) {
                responseContent.innerHTML = `
                    <div class="no-response">
                        <i class="fas fa-info-circle"></i>
                        <p>No admin response yet. Check back later for updates.</p>
                    </div>
                `;
            } else {
                const responseData = querySnapshot.docs[0].data();
                responseContent.innerHTML = `
                    <div class="response-meta">
                        <span class="response-date">
                            ${new Date(responseData.timestamp).toLocaleDateString()}
                        </span>
                        <span class="response-status status-${(responseData.status || '').toLowerCase().replace(/\s+/g, '')}">
                            ${escapeHtml(responseData.status || '')}
                        </span>
                    </div>
                    <div class="response-text">
                        ${escapeHtml(responseData.response || '')}
                    </div>
                    ${responseData.adminName ? `
                        <div class="response-admin">
                            <i class="fas fa-user-shield"></i>
                            Response by: ${escapeHtml(responseData.adminName)}
                        </div>
                    ` : ''}
                `;
            }
        })
        .catch((error) => {
            console.error('Error loading admin response: ', error);
            responseSection.querySelector('.admin-response-content').innerHTML = `
                <div class="error-response">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading response. Please try again later.</p>
                </div>
            `;
        });
}

// Update hero stats to use Firebase
function updateHeroStats() {
    // Total suggestions
    db.collection(SUGGESTIONS_COLLECTION).get()
        .then((querySnapshot) => {
            const total = querySnapshot.size;
            document.getElementById('totalSuggestionsCount').textContent = total;
            
            // Count resolved suggestions
            let resolved = 0;
            querySnapshot.forEach((doc) => {
                if (doc.data().status === 'Resolved') {
                    resolved++;
                }
            });
            document.getElementById('resolvedCount').textContent = resolved;
        })
        .catch((error) => {
            console.error('Error loading stats: ', error);
        });
}

// ... rest of your existing functions ...