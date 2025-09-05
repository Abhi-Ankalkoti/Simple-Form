# Contact Manager (Static Web App)

A simple form with CRUD (Create, Read, Update, Delete) using LocalStorage. Fields: name, date of birth, email, mobile number, photo upload.

## Run locally

- Open `index.html` in your browser (double-click) or serve with a simple server.

Windows PowerShell quick server:

```powershell
cd "C:\Users\abhia\OneDrive\Desktop\Internship"
python -m http.server 5500
```

Then open `http://localhost:5500/` in your browser.

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this `Internship` folder content to the repo root.
2. In GitHub, go to Settings → Pages.
3. Under "Source", select `Deploy from a branch`.
4. Choose branch `main` (or `master`) and folder `/ (root)`, then Save.
5. After a minute, your site will be live at the URL shown (e.g., `https://<your-username>.github.io/<repo-name>/`).

Tip: Ensure `index.html` is at the repository root.

## Deploy to Netlify (no build)

1. Go to `https://app.netlify.com/` and log in.
2. Click "Add new site" → "Deploy manually".
3. Drag-and-drop the folder containing `index.html`, `styles.css`, and `app.js`.
4. Netlify will give you a live URL instantly. Optionally connect your Git repo for automatic deploys.

## Data & Privacy

- All data is stored in your browser's LocalStorage under the key `contacts-db`.
- Clearing browser storage or using a different device/browser will reset the data.

## Notes

- Photo uploads are stored as data URLs in LocalStorage for simplicity.
- Validations include: required fields, email format, and 10-digit mobile number. 