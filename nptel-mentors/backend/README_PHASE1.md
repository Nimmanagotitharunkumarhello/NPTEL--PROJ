# NPTEL Mentorship Platform

## Phase 1 Updates (Backend)

### Prerequisites
- Python 3.8+
- MongoDB (Local or Atlas)

### Setup

1.  **Navigate to Backend:**
    ```bash
    cd backend
    ```

2.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment:**
    - Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    - Edit `.env` and set your `MONGO_URI` and other secrets.

4.  **Run Application:**
    ```bash
    python app.py
    ```

5.  **Run Tests:**
    ```bash
    pytest tests/
    ```

### API Endpoints (New/Updated)
-   `GET /api/health`: Check database connection status.
-   `POST /signup`: Register with duplicate email prevention.
