UniVibe Setup

1. Clone Project

git clone https://github.com/<your-username>/univibe.git
cd univibe

2. Install Frontend (Node.js)

npm install
npm run dev

Frontend runs at: http://localhost:3000

3. Install ML Backend (Python)

pip install -r requirements.txt

4. Start ML Server

start_ml.bat
or
python -m uvicorn backend.main:app --reload

ML API runs at: http://127.0.0.1:8000/docs
