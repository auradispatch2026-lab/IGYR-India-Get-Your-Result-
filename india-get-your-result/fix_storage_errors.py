import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
js_path = os.path.join(base, "js/storage.js")

with open(js_path, "r") as f:
    js = f.read()

# Make fetch check res.ok
def fix_fetch(js_code, endpoint):
    old_str = f"""    return fetch(API_BASE + '/{endpoint}', {{
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({endpoint})
    }}).catch(e => {{ console.error("DB Save Error:", e); alert("Error saving to database: " + e.message); }});"""
    
    new_str = f"""    return fetch(API_BASE + '/{endpoint}', {{
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({endpoint})
    }}).then(res => {{
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }}).catch(e => {{ 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    }});"""
    return js_code.replace(old_str, new_str)

js = fix_fetch(js, "institutes")
js = fix_fetch(js, "results")
js = fix_fetch(js, "notices")

# quicklinks is slightly different
old_ql = """    return fetch(API_BASE + '/quicklinks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(links)
    }).catch(e => { console.error("DB Save Error:", e); alert("Error saving to database: " + e.message); });"""

new_ql = """    return fetch(API_BASE + '/quicklinks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(links)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }).catch(e => { 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    });"""

if old_ql in js:
    js = js.replace(old_ql, new_ql)

with open(js_path, "w") as f:
    f.write(js)
print("Added error handling to storage.js!")
