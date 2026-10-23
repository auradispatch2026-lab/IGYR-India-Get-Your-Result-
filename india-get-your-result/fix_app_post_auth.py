import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
app_path = os.path.join(base, "app.py")

with open(app_path, "r") as f:
    app_code = f.read()

# Add a simple token verification function
verify_func = """
def verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    # Accept both super admin and institute tokens for saving data
    return token in ["igyr_super_secret_auth_token_8829", "igyr_inst_secret_auth_token_7731"]

# API Routes for saving data
"""

# Replace the save routes to include token verification
old_save_inst = """@app.route('/api/institutes', methods=['POST'])
def save_institutes():
    data = request.json
    institutes_col.delete_many({})
    if data:
        institutes_col.insert_many(data)
    return jsonify({"status": "success"})"""

new_save_inst = """@app.route('/api/institutes', methods=['POST'])
def save_institutes():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    institutes_col.delete_many({})
    if data:
        institutes_col.insert_many(data)
    return jsonify({"status": "success"})"""

old_save_results = """@app.route('/api/results', methods=['POST'])
def save_results():
    data = request.json
    results_col.delete_many({})
    if data:
        results_col.insert_many(data)
    return jsonify({"status": "success"})"""

new_save_results = """@app.route('/api/results', methods=['POST'])
def save_results():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    results_col.delete_many({})
    if data:
        results_col.insert_many(data)
    return jsonify({"status": "success"})"""

old_save_notices = """@app.route('/api/notices', methods=['POST'])
def save_notices():
    data = request.json
    notices_col.delete_many({})
    if data:
        notices_col.insert_many(data)
    return jsonify({"status": "success"})"""

new_save_notices = """@app.route('/api/notices', methods=['POST'])
def save_notices():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    notices_col.delete_many({})
    if data:
        notices_col.insert_many(data)
    return jsonify({"status": "success"})"""

old_save_ql = """@app.route('/api/quicklinks', methods=['POST'])
def save_quicklinks():
    data = request.json
    quicklinks_col.delete_many({})
    quicklinks_col.insert_one({"links": data})
    return jsonify({"status": "success"})"""

new_save_ql = """@app.route('/api/quicklinks', methods=['POST'])
def save_quicklinks():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    quicklinks_col.delete_many({})
    quicklinks_col.insert_one({"links": data})
    return jsonify({"status": "success"})"""

if "# API Routes for saving data" in app_code:
    app_code = app_code.replace("# API Routes for saving data", verify_func)
    app_code = app_code.replace(old_save_inst, new_save_inst)
    app_code = app_code.replace(old_save_results, new_save_results)
    app_code = app_code.replace(old_save_notices, new_save_notices)
    app_code = app_code.replace(old_save_ql, new_save_ql)
    with open(app_path, "w") as f:
        f.write(app_code)
    print("Secured app.py POST routes!")
else:
    print("Could not find POST routes block!")
