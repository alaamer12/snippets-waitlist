// Initialize PouchDB
const db = new PouchDB('snippets_waitlist');

// Create initial design document for queries
db.put({
    _id: '_design/email_index',
    views: {
        by_email: {
            map: function(doc) {
                if (doc.email) {
                    emit(doc.email);
                }
            }.toString()
        }
    }
}).catch(err => {
    if (err.name !== 'conflict') {
        console.error('Failed to create design document:', err);
    }
});

class WaitlistStorage {
    constructor() {
        this.init();
    }

    async init() {
        try {
            const result = await db.allDocs({ include_docs: true });
            this.updateUI(result.total_rows);
        } catch (err) {
            console.error('Failed to initialize database:', err);
        }
    }

    async add(email) {
        try {
            // Check if email exists using view
            const result = await db.query('email_index/by_email', {
                key: email,
                limit: 1
            });

            if (result.rows.length > 0) {
                return false; // Email already exists
            }

            // Add new entry
            const response = await db.post({
                email,
                timestamp: new Date().toISOString(),
                type: 'waitlist_entry'
            });

            if (response.ok) {
                // Update UI with new count
                const count = await this.getCount();
                this.updateUI(count);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to add email:', err);
            throw err; // Propagate error to show in UI
        }
    }

    async getCount() {
        try {
            const result = await db.allDocs();
            return result.total_rows;
        } catch (err) {
            console.error('Failed to get count:', err);
            return 0;
        }
    }

    updateUI(count) {
        const countElement = document.getElementById('waitlistCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }
}

// Toast notification handler
class Toast {
    constructor() {
        this.element = document.getElementById('toast');
        this.visible = false;
        this.timeoutId = null;
    }

    show(message, type = 'success') {
        // Clear any existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Update toast style based on type
        this.element.className = `fixed bottom-4 right-4 px-6 py-4 rounded-lg text-white transition-all duration-300`;
        
        if (type === 'success') {
            this.element.classList.add('bg-green-500');
        } else if (type === 'error') {
            this.element.classList.add('bg-red-500');
        }

        // Update message and show toast
        this.element.textContent = message;
        this.element.style.opacity = '1';
        this.element.style.transform = 'translateY(0)';
        this.element.style.pointerEvents = 'auto';

        // Hide after 3 seconds
        this.timeoutId = setTimeout(() => {
            this.hide();
        }, 3000);
    }

    hide() {
        this.element.style.opacity = '0';
        this.element.style.transform = 'translateY(full)';
        this.element.style.pointerEvents = 'none';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const storage = new WaitlistStorage();
    const toast = new Toast();
    const form = document.getElementById('waitlistForm');
    const emailInput = document.getElementById('email');

    // Update initial count
    storage.init();

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.show('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Adding...';
        submitButton.disabled = true;

        try {
            // Try to add to waitlist
            const added = await storage.add(email);
            if (added) {
                toast.show('Successfully joined the waitlist!');
                emailInput.value = '';
            } else {
                toast.show('This email is already on the waitlist', 'error');
            }
        } catch (err) {
            console.error('Error adding to waitlist:', err);
            toast.show('Failed to join waitlist. Please try again.', 'error');
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });

    // Add some animation to the input
    emailInput.addEventListener('focus', () => {
        emailInput.classList.add('scale-105');
        emailInput.style.transition = 'transform 0.3s ease';
    });

    emailInput.addEventListener('blur', () => {
        emailInput.classList.remove('scale-105');
    });
});
