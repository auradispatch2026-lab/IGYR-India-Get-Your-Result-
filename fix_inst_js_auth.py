import os
import re

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
js_path = os.path.join(base, "js/admin.js")

with open(js_path, "r") as f:
    js = f.read()

# Replace the insecure client-side password check for institute
old_inst_login = """    if (instLoginForm) {
        instLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const instId = document.getElementById('inst-id').value.trim();
            const instPass = document.getElementById('inst-pass').value.trim();
            
            const insts = getInstitutes();
            const found = insts.find(i => i.id === instId && i.password === instPass);
            
            if (found) {
                if (found.status !== 'APPROVED') {
                    alert('Your institute is pending approval by the Admin.');
                    return;
                }
                sessionStorage.setItem('inst_logged_in', found.id);
                window.location.href = 'institute-dashboard.html';
            } else {
                alert('Invalid Institute ID or Password.');
            }
        });
    }"""

new_inst_login = """    if (instLoginForm) {
        instLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const instId = document.getElementById('inst-id').value.trim();
            const instPass = document.getElementById('inst-pass').value.trim();
            
            // SECURE SERVER-SIDE AUTHENTICATION
            fetch(API_BASE + '/auth/institute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: instId, password: instPass })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const insts = getInstitutes();
                    const found = insts.find(i => i.id === instId);
                    if (found && found.status !== 'APPROVED') {
                        alert('Your institute is pending approval by the Admin.');
                        return;
                    }
                    sessionStorage.setItem('inst_logged_in', instId);
                    sessionStorage.setItem('inst_token', data.token);
                    window.location.href = 'institute-dashboard.html';
                } else {
                    alert('Invalid Institute ID or Password.');
                }
            })
            .catch(err => {
                console.error(err);
                alert("Server connection failed!");
            });
        });
    }"""

if "instLoginForm.addEventListener('submit'" in js:
    js = js.replace(old_inst_login, new_inst_login)
    with open(js_path, "w") as f:
        f.write(js)
    print("Secured Institute login in admin.js!")
else:
    print("Could not find the old institute login block!")
