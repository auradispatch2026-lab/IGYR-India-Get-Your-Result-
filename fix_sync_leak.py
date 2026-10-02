import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
app_path = os.path.join(base, "app.py")

with open(app_path, "r") as f:
    app_code = f.read()

# 1. Hide passwords from the public /api/sync
old_sync = "institutes = list(institutes_col.find({}, {'_id': 0}))"
new_sync = """    # Fetch institutes but STRIP passwords so hackers can't see them on the public frontend!
    institutes = list(institutes_col.find({}, {'_id': 0}))
    for inst in institutes:
        inst.pop('password', None)"""

if old_sync in app_code:
    app_code = app_code.replace(old_sync, new_sync)

# 2. Preserve passwords when the frontend saves back the array
old_save = """@app.route('/api/institutes', methods=['POST'])
def save_institutes():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    institutes_col.delete_many({})
    if data:
        institutes_col.insert_many(data)
    return jsonify({"status": "success"})"""

new_save = """@app.route('/api/institutes', methods=['POST'])
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
    return jsonify({"status": "success"})"""

if old_save in app_code:
    app_code = app_code.replace(old_save, new_save)

with open(app_path, "w") as f:
    f.write(app_code)
print("Patched password leak!")
