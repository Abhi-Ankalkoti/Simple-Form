(function() {
	const appRoot = document.getElementById('app');

	function render() {
		appRoot.innerHTML = `
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
					<button class="primary" type="submit">Save</button>
					<button class="secondary" type="reset">Clear</button>
				</div>
			</form>

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

			<div class="footer">Data is stored locally in your browser.</div>
		`;

		attachHandlers();
		loadRows();
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
		form.addEventListener('reset', () => clearErrors());
	}

	function getDb() {
		const raw = localStorage.getItem('contacts-db');
		return raw ? JSON.parse(raw) : [];
	}

	function setDb(data) {
		localStorage.setItem('contacts-db', JSON.stringify(data));
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

	function onSubmit(e) {
		e.preventDefault();
		const form = e.target;
		const idField = form.dataset.editingId || null;

		const values = {
			name: document.getElementById('name').value,
			dob: document.getElementById('dob').value,
			email: document.getElementById('email').value,
			mobile: document.getElementById('mobile').value,
			photo: document.getElementById('photo-preview').src || ''
		};

		const errors = validate(values, Boolean(idField));
		if (Object.keys(errors).length) { showErrors(errors); return; }

		const db = getDb();
		if (idField) {
			const idx = db.findIndex(r => r.id === idField);
			if (idx >= 0) db[idx] = { ...db[idx], ...values };
		} else {
			const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
			db.push({ id, ...values });
		}
		setDb(db);
		form.reset();
		document.getElementById('photo-preview').src = '';
		form.dataset.editingId = '';
		loadRows();
	}

	function loadRows() {
		const rowsEl = document.getElementById('rows');
		const db = getDb();
		rowsEl.innerHTML = db.map(r => `
			<tr>
				<td>${r.photo ? `<img class="avatar" src="${r.photo}" alt="${r.name}">` : ''}</td>
				<td>${escapeHtml(r.name)}</td>
				<td>${escapeHtml(r.dob)}</td>
				<td>${escapeHtml(r.email)}</td>
				<td>${escapeHtml(r.mobile)}</td>
				<td>
					<button class="secondary" data-action="edit" data-id="${r.id}">Edit</button>
					<button class="danger" data-action="delete" data-id="${r.id}">Delete</button>
				</td>
			</tr>
		`).join('');

		rowsEl.querySelectorAll('button[data-action="edit"]').forEach(btn => btn.addEventListener('click', onEdit));
		rowsEl.querySelectorAll('button[data-action="delete"]').forEach(btn => btn.addEventListener('click', onDelete));
	}

	function onEdit(e) {
		const id = e.currentTarget.getAttribute('data-id');
		const record = getDb().find(r => r.id === id);
		if (!record) return;
		document.getElementById('name').value = record.name;
		document.getElementById('dob').value = record.dob;
		document.getElementById('email').value = record.email;
		document.getElementById('mobile').value = record.mobile;
		document.getElementById('photo-preview').src = record.photo || '';
		document.getElementById('contact-form').dataset.editingId = record.id;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function onDelete(e) {
		const id = e.currentTarget.getAttribute('data-id');
		const db = getDb();
		const next = db.filter(r => r.id !== id);
		setDb(next);
		loadRows();
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