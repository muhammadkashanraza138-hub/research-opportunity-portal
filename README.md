# University Research Opportunity Portal

A beginner-friendly web application built with Python, Flask, MySQL, HTML, CSS and JavaScript. Faculty can create, view, update, close/reopen and delete research opportunities. All opportunity records are stored in MySQL and accessed through the REST API.

## Features

- Create a research opportunity (`POST /api/opportunities`)
- Retrieve all opportunities (`GET /api/opportunities`)
- Retrieve one opportunity (`GET /api/opportunities/<id>`)
- Update an opportunity (`PUT /api/opportunities/<id>`)
- Delete an opportunity (`DELETE /api/opportunities/<id>`)
- Validate required fields, positive positions, date format and Open/Closed status
- Return appropriate 200, 201, 400, 404 and 500 status codes
- Responsive frontend with details, create/edit form, status filter, close/reopen and delete controls
- Postman collection included in `postman/`

## Requirements

- Python 3.10 or newer
- MySQL Server
- Postman (for API testing)
- Git (for version control)

## Setup on Ubuntu/Linux

### 1. Create the database and table

Start your MySQL service:

```bash
sudo systemctl start mysql
```

Log in to MySQL:

```bash
sudo mysql
```

Inside the MySQL prompt, run the schema file. If you are already in the project directory, exit MySQL with `exit;` and run:

```bash
mysql -u root -p < schema.sql
```

Enter your MySQL password when prompted. If your local MySQL root account uses socket authentication, run `sudo mysql < schema.sql` instead.

### 2. Create and activate a Python virtual environment

From the project directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If creating the virtual environment fails because the module is missing, install it with `sudo apt install python3-venv` and repeat the command.

### 3. Configure database credentials

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` in a text editor and set `DB_USER` and `DB_PASSWORD` to your local MySQL credentials. Keep `.env` private; it is ignored by Git.

Example only:

```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_local_password
DB_NAME=research_portal
```

Do not copy a real password into the README or upload `.env` to GitHub.

### 4. Run the application

```bash
python app.py
```

Open **http://127.0.0.1:5000** in your browser. Flask serves the frontend and API from the same local server, so no separate frontend server is needed.

## API reference

Base URL: `http://127.0.0.1:5000`

| Method | Endpoint | Purpose | Typical response |
|---|---|---|---|
| POST | `/api/opportunities` | Create | `201 Created` |
| GET | `/api/opportunities` | List all | `200 OK` |
| GET | `/api/opportunities/1` | Get one by ID | `200 OK` or `404 Not Found` |
| PUT | `/api/opportunities/1` | Replace/update details | `200 OK`, `400 Bad Request` or `404 Not Found` |
| DELETE | `/api/opportunities/1` | Delete | `200 OK` or `404 Not Found` |

### Example JSON body

Use this body for POST and PUT requests (change values as needed):

```json
{
  "title": "Cybersecurity Threat Analysis",
  "description": "Analyze network traffic patterns and evaluate ways to detect suspicious activity.",
  "research_area": "Cybersecurity",
  "faculty_name": "Dr. Ayesha Noor",
  "department": "Computer Science",
  "required_skills": "Networking, Python, Linux",
  "positions": 2,
  "deadline": "2027-03-01",
  "status": "Open"
}
```

`positions` must be a whole number of at least 1, `deadline` must use `YYYY-MM-DD`, and `status` must be `Open` or `Closed`. Missing or invalid fields return `400 Bad Request` with error details.

## Postman testing

1. Start Flask using `python app.py`.
2. Open Postman and import `postman/Research_Opportunity_Portal.postman_collection.json`.
3. Keep the `baseUrl` collection variable as `http://127.0.0.1:5000`.
4. Run requests in order. Run all three Create requests first; the first Create request saves its generated ID in the collection variable `opportunityId`.
5. Run Retrieve All, Retrieve One, Update, Close, Invalid Request, Delete, and Confirm Deleted (404).
6. If you rerun the collection, create a fresh opportunity first so `opportunityId` refers to a record that exists.

The assignment asks for at least three created records; the collection provides three separate Create requests.

## GitHub setup

Create an empty repository on GitHub, then from this project directory run:

```bash
git init
git add .
git commit -m "Create Flask API and MySQL schema"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/research-opportunity-portal.git
git push -u origin main
```

Replace the example URL with your own repository URL. Add further meaningful commits as you complete and test the frontend, API tests and documentation. Make the repository accessible to your instructor. Never commit `.env`, passwords, tokens or other credentials.

## One-minute demonstration plan

Record your screen with the Flask terminal and browser/Postman ready. Keep the video under 60 seconds:

- **0–5 sec:** Show Flask running and open the portal.
- **5–17 sec:** Create an opportunity and show it on the page.
- **17–25 sec:** Open details and edit a field.
- **25–32 sec:** Close an opportunity and show its Closed status.
- **32–38 sec:** Delete an opportunity.
- **38–48 sec:** In Postman, show the GET list and a successful response.
- **48–56 sec:** Show the invalid request returning 400 and deleted ID returning 404.
- **56–60 sec:** Briefly show the project/repository.

Adjust the timing to fit your actual recording. Make sure your video demonstrates the required actions, not just the code.

## Project structure

```text
research_opportunity_portal/
├── app.py
├── schema.sql
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── templates/
│   └── index.html
├── static/
│   ├── app.js
│   └── style.css
└── postman/
    └── Research_Opportunity_Portal.postman_collection.json
```

## Before submission

- [ ] Confirm MySQL is running and `.env` credentials work.
- [ ] Test every frontend CRUD action.
- [ ] Import and run the Postman collection; verify 201, 200, 400 and 404 responses.
- [ ] Push all project files and meaningful commits to GitHub.
- [ ] Replace the example GitHub URL above with your actual repository URL.
- [ ] Record the one-minute demonstration video and add its link to this README.
- [ ] Create the final ZIP using the exact naming pattern given by your instructor: `P24_0000_NAME_CLASS.zip` (replace placeholders with your own details).
