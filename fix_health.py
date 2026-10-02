import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
app_path = os.path.join(base, "app.py")

with open(app_path, "r") as f:
    app_code = f.read()

health_route = """
@app.route('/health')
def health_check():
    return jsonify({"status": "ok", "message": "IGYR Backend is running smoothly."}), 200

"""

if "@app.route('/health')" not in app_code:
    # insert before @app.route('/')
    app_code = app_code.replace("@app.route('/')", health_route + "@app.route('/')")
    with open(app_path, "w") as f:
        f.write(app_code)
    print("Added health route!")
else:
    print("Health route already exists.")
