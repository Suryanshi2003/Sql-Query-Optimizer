# SQL Query Optimizer

An AI-powered full-stack application that analyzes SQL queries and suggests optimized versions with explanations and optimization tips.

Supports PostgreSQL, MySQL, and Google BigQuery.

**Live Demo:** [Add Vercel URL]

## Features

* AI-powered SQL query optimization
* Supports PostgreSQL, MySQL, and BigQuery
* Optimization tips and explanations
* Query history
* Query usage statistics


## Tech Stack

| Technology              | Purpose                         |
| ----------------------- | ------------------------------- |
| Angular 17 + TypeScript | Frontend                        |
| FastAPI + Python        | REST API and backend            |
| Groq API                | LLM inference                   |
| Pydantic                | Request validation              |
| SQLAlchemy              | Database ORM                    |
| SQLite                  | Local development               |
| PostgreSQL              | Production database             |
| Vercel                  | Frontend deployment             |
| Render                  | Backend and database deployment |

## Architecture

```text
User
  ↓
Angular 17 (Vercel)
  ↓ HTTP
FastAPI (Render)
  ↓
Groq LLM
  ↓
Optimized Query + Tips + Explanation
  ↓
PostgreSQL
```

### Request Flow

```text
SQL Query
   ↓
POST /optimize
   ↓
FastAPI Validation
   ↓
Groq LLM
   ↓
Structured JSON Response
   ↓
Save to PostgreSQL
   ↓
Return Result to Angular
```

## Project Structure

```text
SQL-Query-Optimizer/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── angular.json
├── .gitignore
└── README.md
```

## Installation

### Backend

```bash
cd backend

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
```

Create `.env`:

```env
GROQ_API_KEY=your_api_key
DATABASE_URL=sqlite:///./sql_optimizer.db
```

Run:

```bash
uvicorn main:app --reload
```

Backend: `http://localhost:8000`

Swagger Docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
ng serve
```

Frontend: `http://localhost:4200`

## Usage

1. Enter a SQL query.
2. Select the database type.
3. Optionally provide additional context.
4. Submit the query.
5. View the optimized query, tips, explanation, and estimated improvement.
6. Review previous queries through query history.

## API

| Method | Endpoint    | Description                 |
| ------ | ----------- | --------------------------- |
| GET    | `/`         | Service status              |
| GET    | `/health`   | Backend and database health |
| POST   | `/optimize` | Analyze and optimize SQL    |
| GET    | `/history`  | Retrieve query history      |
| GET    | `/stats`    | Query statistics            |

### POST `/optimize`

```json
{
  "query": "SELECT * FROM users WHERE age > 25",
  "database_type": "postgres",
  "context": ""
}
```

Response includes:

```json
{
  "original_query": "...",
  "optimized_query": "...",
  "tips": [],
  "estimated_improvement": "30%",
  "explanation": "..."
}
```

## Engineering Decisions

### SQLite → PostgreSQL

SQLite is used for local development because it requires no separate database server. PostgreSQL is used in production for persistent database storage.

SQLAlchemy allows the same database logic to work with both.

### LLM as Recommendation Layer

The application does not execute AI-generated SQL. The LLM provides optimization recommendations while the user remains responsible for reviewing the generated query.

### Environment Variables

API keys and database credentials are stored in environment variables rather than committed to the repository.

## Deployment

```text
Angular → Vercel
   ↓
FastAPI → Render
   ↓
Groq API + PostgreSQL
```


