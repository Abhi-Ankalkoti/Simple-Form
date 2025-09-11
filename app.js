(function() {
	const appRoot = document.getElementById('app');

	function render() {
		appRoot.innerHTML = `
			<section class="form-section">
				<form id="contact-form" novalidate>
					<div class="form-grid">
						<div class="field">
							<label for="name">Name</label>
							<input id="name" name="name" type="text" placeholder="Full name" required />
							<div class="error" data-error-for="name"></div>
						</div>

						<div class="field">
							<label for="dob">Date of Birth</label>
							<input id="dob" name="dob" type="date" required />
							<div class="error" data-error-for="dob"></div>
						</div>

						<div class="field">
							<label for="email">Email</label>
							<input id="email" name="email" type="email" placeholder="you@example.com" required />
							<div class="error" data-error-for="email"></div>
						</div>

						<div class="field">
							<label for="mobile">Mobile Number</label>
							<input id="mobile" name="mobile" type="text" placeholder="10-digit number" inputmode="numeric" required />
							<div class="error" data-error-for="mobile"></div>
						</div>

						<div class="field">
							<label for="photo">Photo</label>
							<input id="photo" name="photo" type="file" accept="image/*" />
							<div class="error" data-error-for="photo"></div>
						</div>

						<div class="field">
							<label>&nbsp;</label>
							<img id="photo-preview" class="preview" alt="Preview" />
						</div>
					</div>

					<div class="actions">
						<button class="primary" type="submit">💾 Save Contact</button>
						<button class="secondary" type="reset">🗑️ Clear Form</button>
					</div>
				</form>
			</section>

			<section class="table-section">
				<div class="table-wrapper">
					<table>
						<thead>
							<tr>
								<th>Photo</th>
								<th>Name</th>
								<th>DOB</th>
								<th>Email</th>
								<th>Mobile</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="rows"></tbody>
					</table>
				</div>
			</section>

			<div class="footer">☁️ Data is stored securely in Supabase cloud database</div>
		`;

		attachHandlers();
		loadRows();
		setupRealtimeSubscription();
	}

	function attachHandlers() {
		const form = document.getElementById('contact-form');
		const photoInput = document.getElementById('photo');
		const preview = document.getElementById('photo-preview');

		photoInput.addEventListener('change', () => {
			const file = photoInput.files && photoInput.files[0];
			if (!file) { preview.src = ''; return; }
			const reader = new FileReader();
			reader.onload = e => { preview.src = String(e.target.result); };
			reader.readAsDataURL(file);
		});

		form.addEventListener('submit', onSubmit);
		form.addEventListener('reset', () => {
			clearErrors();
			// Reset button text
			const submitBtn = form.querySelector('button[type="submit"]');
			submitBtn.textContent = '💾 Save Contact';
		});

		// Add touch-friendly interactions
		document.addEventListener('touchstart', function() {}, {passive: true});
		
		// Add haptic feedback for mobile devices
		if ('vibrate' in navigator) {
			document.addEventListener('click', function(e) {
				if (e.target.tagName === 'BUTTON') {
					navigator.vibrate(10);
				}
			});
		}
	}

	// Supabase database functions
	async function getDb() {
		try {
			const { data, error } = await window.supabaseClient
				.from('contacts')
				.select('*')
				.order('created_at', { ascending: false });
			
			if (error) {
				console.error('Error fetching contacts:', error);
				showNotification('Failed to load contacts', 'error');
				return [];
			}
			
			return data || [];
		} catch (error) {
			console.error('Error in getDb:', error);
			showNotification('Network error loading contacts', 'error');
			return [];
		}
	}

	async function saveContact(contactData) {
		try {
			const { data, error } = await window.supabaseClient
				.from('contacts')
				.insert([contactData])
				.select();
			
			if (error) {
				console.error('Error saving contact:', error);
				showNotification('Failed to save contact', 'error');
				throw error;
			}
			
			return data[0];
		} catch (error) {
			console.error('Error in saveContact:', error);
			showNotification('Network error saving contact', 'error');
			throw error;
		}
	}

	async function updateContact(id, contactData) {
		try {
			const { data, error } = await window.supabaseClient
				.from('contacts')
				.update(contactData)
				.eq('id', id)
				.select();
			
			if (error) {
				console.error('Error updating contact:', error);
				showNotification('Failed to update contact', 'error');
				throw error;
			}
			
			return data[0];
		} catch (error) {
			console.error('Error in updateContact:', error);
			showNotification('Network error updating contact', 'error');
			throw error;
		}
	}

	async function deleteContact(id) {
		try {
			const { error } = await window.supabaseClient
				.from('contacts')
				.delete()
				.eq('id', id);
			
			if (error) {
				console.error('Error deleting contact:', error);
				showNotification('Failed to delete contact', 'error');
				throw error;
			}
			
			return true;
		} catch (error) {
			console.error('Error in deleteContact:', error);
			showNotification('Network error deleting contact', 'error');
			throw error;
		}
	}

	function validate(values, isUpdate) {
		const errors = {};
		const name = values.name?.trim();
		if (!name) errors.name = 'Name is required';
		else if (name.length < 2) errors.name = 'Name must be at least 2 characters';

		const dob = values.dob?.trim();
		if (!dob) errors.dob = 'Date of birth is required';
		else if (Number.isNaN(Date.parse(dob))) errors.dob = 'Invalid date';

		const email = values.email?.trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email) errors.email = 'Email is required';
		else if (!emailRegex.test(email)) errors.email = 'Invalid email';

		const mobile = values.mobile?.trim();
		const mobileRegex = /^\d{10}$/;
		if (!mobile) errors.mobile = 'Mobile is required';
		else if (!mobileRegex.test(mobile)) errors.mobile = 'Must be 10 digits';

		// photo optional; ensure it's an image if present
		if (values.photo && !values.photo.startsWith('data:image')) {
			errors.photo = 'Invalid image file';
		}

		return errors;
	}

	function showErrors(errors) {
		clearErrors();
		Object.entries(errors).forEach(([key, message]) => {
			const el = document.querySelector(`.error[data-error-for="${key}"]`);
			if (el) el.textContent = String(message);
		});
	}

	function clearErrors() {
		document.querySelectorAll('.error').forEach(el => el.textContent = '');
	}

	// Notification system
	function showNotification(message, type = 'info') {
		// Remove existing notifications
		const existing = document.querySelector('.notification');
		if (existing) existing.remove();

		const notification = document.createElement('div');
		notification.className = `notification notification-${type}`;
		notification.innerHTML = `
			<div class="notification-content">
				<span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
				<span class="notification-message">${message}</span>
				<button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
			</div>
		`;

		document.body.appendChild(notification);

		// Auto remove after 5 seconds
		setTimeout(() => {
			if (notification.parentElement) {
				notification.remove();
			}
		}, 5000);
	}

	async function onSubmit(e) {
		e.preventDefault();
		const form = e.target;
		const submitBtn = form.querySelector('button[type="submit"]');
		const idField = form.dataset.editingId || null;

		// Add loading state
		submitBtn.classList.add('loading');
		submitBtn.disabled = true;

		try {
			const values = {
				name: document.getElementById('name').value,
				dob: document.getElementById('dob').value,
				email: document.getElementById('email').value,
				mobile: document.getElementById('mobile').value,
				photo: document.getElementById('photo-preview').src || ''
			};

			const errors = validate(values, Boolean(idField));
			if (Object.keys(errors).length) { 
				showErrors(errors); 
				return; 
			}

			if (idField) {
				// Update existing contact
				await updateContact(idField, values);
				showNotification('Contact updated successfully!', 'success');
			} else {
				// Create new contact
				await saveContact(values);
				showNotification('Contact saved successfully!', 'success');
			}

			// Reset form
			form.reset();
			document.getElementById('photo-preview').src = '';
			form.dataset.editingId = '';
			
			// Reload data
			await loadRows();
			
		} catch (error) {
			console.error('Error submitting form:', error);
			showNotification('Failed to save contact. Please try again.', 'error');
		} finally {
			// Remove loading state
			submitBtn.classList.remove('loading');
			submitBtn.disabled = false;
			
			// Show success feedback
			if (!submitBtn.textContent.includes('✅')) {
				submitBtn.textContent = '✅ Saved!';
				setTimeout(() => {
					submitBtn.textContent = idField ? '💾 Update Contact' : '💾 Save Contact';
				}, 2000);
			}
		}
	}

	async function loadRows() {
		const rowsEl = document.getElementById('rows');
		
		try {
			const db = await getDb();
			
			if (db.length === 0) {
				rowsEl.innerHTML = `
					<tr>
						<td colspan="6" style="text-align: center; padding: 40px 20px; color: var(--muted);">
							<div style="font-size: 48px; margin-bottom: 16px;">📇</div>
							<h3 style="margin: 0 0 8px 0; color: var(--text-secondary);">No contacts yet</h3>
							<p style="margin: 0; font-size: 14px;">Add your first contact using the form above</p>
						</td>
					</tr>
				`;
				return;
			}
			
			rowsEl.innerHTML = db.map(r => `
				<tr>
					<td data-label="Photo">${r.photo ? `<img class="avatar" src="${r.photo}" alt="${r.name}">` : '📷 No photo'}</td>
					<td data-label="Name">${escapeHtml(r.name)}</td>
					<td data-label="Date of Birth">${escapeHtml(r.dob)}</td>
					<td data-label="Email">${escapeHtml(r.email)}</td>
					<td data-label="Mobile">${escapeHtml(r.mobile)}</td>
					<td data-label="Actions">
						<button class="secondary" data-action="edit" data-id="${r.id}">✏️ Edit</button>
						<button class="danger" data-action="delete" data-id="${r.id}">🗑️ Delete</button>
					</td>
				</tr>
			`).join('');

			rowsEl.querySelectorAll('button[data-action="edit"]').forEach(btn => btn.addEventListener('click', onEdit));
			rowsEl.querySelectorAll('button[data-action="delete"]').forEach(btn => btn.addEventListener('click', onDelete));
		} catch (error) {
			console.error('Error loading rows:', error);
			rowsEl.innerHTML = `
				<tr>
					<td colspan="6" style="text-align: center; padding: 40px 20px; color: var(--danger);">
						<div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
						<h3 style="margin: 0 0 8px 0; color: var(--danger);">Failed to load contacts</h3>
						<p style="margin: 0; font-size: 14px;">Please check your connection and try again</p>
					</td>
				</tr>
			`;
		}
	}

	async function onEdit(e) {
		const id = e.currentTarget.getAttribute('data-id');
		
		try {
			const db = await getDb();
			const record = db.find(r => r.id === id);
			if (!record) {
				showNotification('Contact not found', 'error');
				return;
			}
			
			document.getElementById('name').value = record.name;
			document.getElementById('dob').value = record.dob;
			document.getElementById('email').value = record.email;
			document.getElementById('mobile').value = record.mobile;
			document.getElementById('photo-preview').src = record.photo || '';
			document.getElementById('contact-form').dataset.editingId = record.id;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (error) {
			console.error('Error loading contact for edit:', error);
			showNotification('Failed to load contact for editing', 'error');
		}
	}

	async function onDelete(e) {
		const id = e.currentTarget.getAttribute('data-id');
		
		try {
			const db = await getDb();
			const record = db.find(r => r.id === id);
			const recordName = record ? record.name : 'this contact';
			
			if (confirm(`Are you sure you want to delete ${recordName}? This action cannot be undone.`)) {
				const btn = e.currentTarget;
				btn.classList.add('loading');
				btn.disabled = true;
				
				await deleteContact(id);
				showNotification(`${recordName} deleted successfully`, 'success');
				await loadRows();
			}
		} catch (error) {
			console.error('Error deleting contact:', error);
			showNotification('Failed to delete contact', 'error');
			
			// Reset button state
			const btn = e.currentTarget;
			btn.classList.remove('loading');
			btn.disabled = false;
		}
	}

	// Setup real-time subscriptions for live updates
	function setupRealtimeSubscription() {
		try {
			const subscription = window.supabaseClient
				.channel('contacts-changes')
				.on('postgres_changes', 
					{ 
						event: '*', 
						schema: 'public', 
						table: 'contacts' 
					}, 
					(payload) => {
						console.log('Real-time update received:', payload);
						loadRows(); // Reload the data when changes occur
					}
				)
				.subscribe();

			console.log('Real-time subscription established');
		} catch (error) {
			console.error('Error setting up real-time subscription:', error);
		}
	}

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	render();
})(); 
