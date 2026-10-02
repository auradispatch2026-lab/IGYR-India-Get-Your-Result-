import os
import re

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
js_path = os.path.join(base, "js/admin.js")

with open(js_path, "r") as f:
    js = f.read()

# Replace the insecure client-side password check
old_login_block = """            if (document.getElementById('admin-user').value === 'admin' && document.getElementById('admin-pass').value === 'cutiee') {
                sessionStorage.setItem('superadmin', 'true');
                window.location.href = 'admin-dashboard.html';
            } else {
                alert('Invalid credentials');
            }"""

new_login_block = """            const u = document.getElementById('admin-user').value;
            const p = document.getElementById('admin-pass').value;
            
            // SECURE SERVER-SIDE AUTHENTICATION
            fetch(API_BASE + '/auth/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    sessionStorage.setItem('superadmin', 'true');
                    sessionStorage.setItem('admin_token', data.token);
                    window.location.href = 'admin-dashboard.html';
                } else {
                    alert('Invalid credentials');
                }
            })
            .catch(err => {
                console.error(err);
                alert("Server connection failed!");
            });"""

if "value === 'cutiee'" in js:
    js = js.replace(old_login_block, new_login_block)
    with open(js_path, "w") as f:
        f.write(js)
    print("Secured admin.js!")
else:
    print("Could not find the old login block in admin.js!")
