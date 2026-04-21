# Movie Recommendation System

Movie Recommendation System is an AI-powered movie discovery platform featuring a hybrid Reinforcement Learning (RL) and Content-Based Recommendation engine.

## How to Run Locally

If you are setting this up on a new laptop, doing an emergency restore, or collaborating, follow these steps to securely run both the Node.js Frontend App and the Python Machine Learning engine.

### 1. Clone Project
```bash
git clone https://github.com/Ajayyl/mrs-2.0.git
cd mrs
```

### 2. Install Frontend (Node.js)
```bash
npm install
npm run dev
```
> **Frontend runs at:** [http://localhost:3000](http://localhost:3000)

### 3. Install ML Backend (Python)
Make sure you have Python installed, then install the required machine learning dependencies (fastapi, uvicorn, pandas, scikit-learn, etc.):
```bash
pip install -r requirements.txt
```

### 4. Start ML Server
```bash
start_ml.bat
```
*(Alternatively, you can run `python -m uvicorn backend.main:app --reload`)*

> **ML API runs at:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Backup & Models Tracking
This repository is configured to safely track all large metadata required for immediate deployment. The following are tracked and will restore flawlessly upon cloning:
- [x] `models/similarity.pkl` (Similarity Model)
- [x] `ml/dataset.csv` (Movie Dataset)
- [x] `data/baseMovies.json` (Base Catalog)
- [x] `requirements.txt` (ML Dependencies)
