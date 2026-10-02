import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
js_path = os.path.join(base, "js/storage.js")

with open(js_path, "r") as f:
    js = f.read()

# Create a helper function to get the auth headers
helper = """
function getAuthHeaders() {
    const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('inst_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
    };
}
"""

js = js.replace("// 3. Data Setters (Update memory immediately, and async POST to Python Backend)", "// 3. Data Setters (Update memory immediately, and async POST to Python Backend)\n" + helper)

js = js.replace("headers: { 'Content-Type': 'application/json' }", "headers: getAuthHeaders()")

with open(js_path, "w") as f:
    f.write(js)
print("Secured storage.js!")

