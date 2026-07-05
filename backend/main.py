"""

SQL Query Optimizer - Backend

FastAPI with Groq AI for SQL optimization

"""



from fastapi import FastAPI, HTTPException

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from datetime import datetime

import os

from dotenv import load_dotenv

from groq import Groq

import json

from sqlalchemy import (
    create_engine,
    Column,
    String,
    DateTime,
    Integer,
    Text,
    func,
    text,
)

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import sessionmaker





load_dotenv()



print("\n" + "="*60)

print("🚀 SQL Query Optimizer Backend Starting")

print("="*60 + "\n")



# DATABASE

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_optimizer.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()



class QueryHistory(Base):

    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)

    original_query = Column(Text, nullable=False)

    optimized_query = Column(Text, nullable=False)

    database_type = Column(String(50), nullable=False)

    optimization_tips = Column(Text, nullable=False)

    estimated_improvement = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(String(100), default="anonymous")



Base.metadata.create_all(bind=engine)



# MODELS

class OptimizeQueryRequest(BaseModel):

    query: str

    database_type: str

    context: str = ""



class OptimizationResponse(BaseModel):

    original_query: str

    optimized_query: str

    tips: list

    estimated_improvement: str

    explanation: str



class QueryHistoryResponse(BaseModel):

    id: int

    original_query: str

    optimized_query: str

    database_type: str

    created_at: datetime

    estimated_improvement: str



# APP

app = FastAPI(title="SQL Query Optimizer", version="1.0.0")



# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sql-query-optimizer-ylqi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# GROQ

client = Groq(api_key=os.getenv("GROQ_API_KEY"))



def analyze_query_with_groq(query: str, database_type: str, context: str = "") -> dict:

    prompt = f"""You are an expert SQL optimization specialist.

 

Analyze this {database_type.upper()} SQL query:

```sql

{query}

```

 

{f"Context: {context}" if context else ""}

 

Return ONLY this JSON format (no markdown):

{{

    "optimized_query": "rewritten query with optimizations",

    "optimization_tips": ["tip 1", "tip 2", "tip 3"],

    "estimated_improvement": "45%",

    "explanation": "brief explanation"

}}"""



    try:

        message = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )



        response_text = message.choices[0].message.content



        if "```json" in response_text:

            response_text = response_text.split("```json")[1].split("```")[0]

        elif "```" in response_text:

            response_text = response_text.split("```")[1].split("```")[0]



        return json.loads(response_text.strip())

    except json.JSONDecodeError:

        raise HTTPException(status_code=400, detail="Failed to parse Groq response")

    except Exception as e:

        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")



# ============================================================================

# ✅ ENDPOINT 1: GET /

# ============================================================================

@app.get("/")

async def root():

    """Root endpoint - API is running"""

    return {

        "status": "alive",

        "service": "SQL Query Optimizer",

        "version": "1.0.0"

    }



# ============================================================================

# ✅ ENDPOINT 2: OPTIONS / (CORS Preflight)

# ============================================================================

@app.options("/{full_path:path}")

async def preflight_handler(full_path: str):

    """Handle CORS preflight requests - REQUIRED FOR CORS"""

    return {"detail": "OK"}



# ============================================================================

# ✅ ENDPOINT 3: GET /health

# ============================================================================

@app.get("/health")

async def health_check():

    """Health check - verify backend is running"""

    try:

        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()

        return {

            "status": "healthy",

            "database": "connected",

            "message": "Backend is running successfully"

        }

    except Exception as e:

        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")



# ============================================================================

# ✅ ENDPOINT 4: POST /optimize (MAIN ENDPOINT - THE IMPORTANT ONE!)

# ============================================================================

@app.post("/optimize")

async def optimize_query(request: OptimizeQueryRequest):

    """Main endpoint - Optimize SQL query using Groq AI"""

    if not request.query or len(request.query.strip()) < 10:

        raise HTTPException(status_code=400, detail="Query must be at least 10 characters")



    if request.database_type not in ["postgres", "mysql", "bigquery"]:

        raise HTTPException(status_code=400, detail="Unsupported database type")



    try:

        optimization = analyze_query_with_groq(

            request.query,

            request.database_type,

            request.context

        )



        db = SessionLocal()

        history_record = QueryHistory(

            original_query=request.query,

            optimized_query=optimization.get("optimized_query", ""),

            database_type=request.database_type,

            optimization_tips=json.dumps(optimization.get("optimization_tips", [])),

            estimated_improvement=optimization.get("estimated_improvement", ""),

        )

        db.add(history_record)

        db.commit()

        db.close()



        return OptimizationResponse(

            original_query=request.query,

            optimized_query=optimization.get("optimized_query", ""),

            tips=optimization.get("optimization_tips", []),

            estimated_improvement=optimization.get("estimated_improvement", ""),

            explanation=optimization.get("explanation", "")

        )

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")



# ============================================================================

# ✅ ENDPOINT 5: GET /history

# ============================================================================

@app.get("/history")

async def get_history(limit: int = 20):

    """Get query history"""

    try:

        db = SessionLocal()

        records = db.query(QueryHistory).order_by(QueryHistory.created_at.desc()).limit(limit).all()

        db.close()



        return [

            QueryHistoryResponse(

                id=r.id,

                original_query=r.original_query,

                optimized_query=r.optimized_query,

                database_type=r.database_type,

                created_at=r.created_at,

                estimated_improvement=r.estimated_improvement

            )

            for r in records

        ]

    except Exception as e:

        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")



# ============================================================================

# ✅ ENDPOINT 6: GET /stats

# ============================================================================

@app.get("/stats")

async def get_stats():

    """Get statistics"""

    try:

        db = SessionLocal()

        total = db.query(func.count(QueryHistory.id)).scalar() or 0

        db_types = db.query(

            QueryHistory.database_type,

            func.count(QueryHistory.id).label("count")

        ).group_by(QueryHistory.database_type).all()

        db.close()



        return {

            "total_queries_analyzed": total,

            "by_database_type": {db_type: count for db_type, count in db_types}

        }

    except Exception as e:

        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")



# START

if __name__ == "__main__":

    import uvicorn

    print("📝 API Docs: http://localhost:8000/docs")

    print("🧪 Health: http://localhost:8000/health")

    print("⚡ Optimize: POST http://localhost:8000/optimize")

    print("📜 History: GET http://localhost:8000/history")

    print("📊 Stats: GET http://localhost:8000/stats\n")

    uvicorn.run(
    app,
    host="0.0.0.0",
    port=int(os.environ.get("PORT", 8001))
)
