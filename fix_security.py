import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
app_path = os.path.join(base, "app.py")

with open(app_path, "r") as f:
    app_code = f.read()

auth_route = """
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
"""

# Inject auth route before the API routes for Initial Sync
if "@app.route('/api/auth/admin'" not in app_code:
    app_code = app_code.replace("# API Routes for Initial Sync", auth_route + "\n# API Routes for Initial Sync")

# Fix CORS to be strict
app_code = app_code.replace("CORS(app)", 'CORS(app, resources={r"/api/*": {"origins": ["https://igyr-india-get-your-result.onrender.com", "http://127.0.0.1:5005", "http://localhost:5005", "http://127.0.0.1:5500"]}})')

with open(app_path, "w") as f:
    f.write(app_code)
print("Secured backend!")

