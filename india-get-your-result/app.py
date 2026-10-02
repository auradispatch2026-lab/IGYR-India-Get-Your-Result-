from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": ["https://igyr-india-get-your-result.onrender.com", "http://127.0.0.1:5005", "http://localhost:5005", "http://127.0.0.1:5500"]}})

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


@app.route('/health')
def health_check():
    return jsonify({"status": "ok", "message": "IGYR Backend is running smoothly."}), 200

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/auth/admin', methods=['POST'])
def admin_login():
    data = request.json
    # The secure password is ONLY stored here on the server
    if data and data.get('username') == 'admin' and data.get('password') == 'cutiee':
        return jsonify({"success": True, "token": "igyr_super_secret_auth_token_8829"}), 200
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/auth/institute', methods=['POST'])
def institute_login():
    data = request.json
    inst_id = data.get('id')
    password = data.get('password')
    inst = institutes_col.find_one({"id": inst_id, "password": password})
    if inst:
        return jsonify({"success": True, "token": "igyr_inst_secret_auth_token_7731"}), 200
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

# API Routes for Initial Sync
@app.route('/api/sync', methods=['GET'])
def sync_data():
    # Return all collections in one go for fast synchronous loading
        # Fetch institutes but STRIP passwords so hackers can't see them on the public frontend!
    institutes = list(institutes_col.find({}, {'_id': 0}))
    for inst in institutes:
        inst.pop('password', None)
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


def verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    # Accept both super admin and institute tokens for saving data
    return token in ["igyr_super_secret_auth_token_8829", "igyr_inst_secret_auth_token_7731"]

# API Routes for saving data

@app.route('/api/institutes', methods=['POST'])
def save_institutes():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    if data:
        # Preserve existing passwords since the frontend doesn't have them anymore!
        existing_insts = { i['id']: i.get('password', 'demo123') for i in institutes_col.find({}) }
        for inst in data:
            if inst['id'] in existing_insts:
                inst['password'] = existing_insts[inst['id']]
            elif 'password' not in inst:
                inst['password'] = 'demo123' # Default for new institutes
        institutes_col.delete_many({})
        institutes_col.insert_many(data)
    return jsonify({"status": "success"})

@app.route('/api/results', methods=['POST'])
def save_results():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    results_col.delete_many({})
    if data:
        results_col.insert_many(data)
    return jsonify({"status": "success"})

@app.route('/api/notices', methods=['POST'])
def save_notices():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    notices_col.delete_many({})
    if data:
        notices_col.insert_many(data)
    return jsonify({"status": "success"})

@app.route('/api/quicklinks', methods=['POST'])
def save_quicklinks():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    quicklinks_col.delete_many({})
    quicklinks_col.insert_one({"links": data})
    return jsonify({"status": "success"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port, debug=False)
