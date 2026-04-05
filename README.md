# Point_Of_Sale_System (POS)

Tech Stack: 
- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express
- Database: MySql

## Project Overview
- frontend/ -> Next.js app
- backend/ -> Express API
- database / -> SQL Schema & seed scripts 

## How To Run 
------------------------------------------------------------
## UNDER CONSTRUCTION ##

## Local Auto Gratuity Smoke Test

1. Start backend API on localhost:4000:
	- `cd backend && npm install && npm run dev`
2. In a second terminal, run the smoke test:
	- `cd backend && npm run smoke:auto-gratuity`

Defaults used by the script:
- Base URL: `http://localhost:4000`
- Manager PIN: `1234`
- Tax rate: `8.25%`

Optional environment overrides:
- `BASE_URL=http://localhost:4000`
- `MANAGER_PIN=1234`
- `TAX_RATE=0.0825`