import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
app_path = os.path.join(base, "app.py")

with open(app_path, "r") as f:
    app_code = f.read()

old_string = 'MONGO_URI = "mongodb+srv://auradispatch2026_db_user:611LdmEjTS7WeqKW@cluster0.z9xcllt.mongodb.net/?appName=Cluster0"'
new_string = 'MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://auradispatch2026_db_user:611LdmEjTS7WeqKW@cluster0.z9xcllt.mongodb.net/?appName=Cluster0")'

if old_string in app_code:
    app_code = app_code.replace(old_string, new_string)
    with open(app_path, "w") as f:
        f.write(app_code)
    print("Updated app.py to use environment variable for MONGO_URI.")
else:
    print("Could not find hardcoded MONGO_URI string.")
