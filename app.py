from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Connect to MongoDB
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://auradispatch2026_db_user:611LdmEjTS7WeqKW@cluster0.z9xcllt.mongodb.net/?appName=Cluster0")
client = MongoClient(MONGO_URI)
db = client['igyr_database']

# Collections
institutes_col = db['institutes']
results_col = db['results']
notices_col = db['notices']
quicklinks_col = db['quicklinks']

# Initialize demo data if collections are empty
def init_db():
    if institutes_col.count_documents({}) == 0:
        institutes_col.insert_many([
            { "id": "IGYR001", "name": "Odisha Public School", "type": "School", "status": "APPROVED", "password": "demo123", "state": "Odisha", "district": "Bhubaneswar", "address": "Plot 42, Vihar Marg" },
            { "id": "IGYR002", "name": "Delhi Modern College", "type": "College", "status": "APPROVED", "password": "demo123", "state": "Odisha", "district": "Bhubaneswar", "address": "Sec 12, South Avenue" }
        ])
    if results_col.count_documents({}) == 0:
        results_col.insert_one({
            "reg": "REG123", "roll": "ROL123", "name": "John Doe", "instId": "IGYR001", 
            "exam": "Annual 2026", "class": "10", 
            "marks": [{"sub": "Math", "max": 100, "obt": 85}, {"sub": "Science", "max": 100, "obt": 90}], 
            "vid": "IGYR-2026-000123"
        })
    if quicklinks_col.count_documents({}) == 0:
        quicklinks_col.insert_one({"links": [
            {"text": "Home", "url": "index.html"},
            {"text": "About", "url": "about.html"},
            {"text": "Results", "url": "search-result.html"},
            {"text": "Admin Login", "url": "admin-login.html"}
        ]})

init_db()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# API Routes for Initial Sync
@app.route('/api/sync', methods=['GET'])
def sync_data():
    # Return all collections in one go for fast synchronous loading
    institutes = list(institutes_col.find({}, {'_id': 0}))
    results = list(results_col.find({}, {'_id': 0}))
    notices = list(notices_col.find({}, {'_id': 0}))
    
    ql_doc = quicklinks_col.find_one({}, {'_id': 0})
    quicklinks = ql_doc['links'] if ql_doc and 'links' in ql_doc else []
    
    return jsonify({
        "institutes": institutes,
        "results": results,
        "notices": notices,
        "quicklinks": quicklinks
    })

# API Routes for saving data
@app.route('/api/institutes', methods=['POST'])
def save_institutes():
    data = request.json
    institutes_col.delete_many({})
    if data:
        institutes_col.insert_many(data)
    return jsonify({"status": "success"})

@app.route('/api/results', methods=['POST'])
def save_results():
    data = request.json
    results_col.delete_many({})
    if data:
        results_col.insert_many(data)
    return jsonify({"status": "success"})

@app.route('/api/notices', methods=['POST'])
def save_notices():
    data = request.json
    notices_col.delete_many({})
    if data:
        notices_col.insert_many(data)
    return jsonify({"status": "success"})

@app.route('/api/quicklinks', methods=['POST'])
def save_quicklinks():
    data = request.json
    quicklinks_col.delete_many({})
    quicklinks_col.insert_one({"links": data})
    return jsonify({"status": "success"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port, debug=False)
