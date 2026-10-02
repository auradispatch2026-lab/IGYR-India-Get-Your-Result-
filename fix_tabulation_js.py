import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
js_path = os.path.join(base, "js/tabulation.js")

with open(js_path, "r") as f:
    js = f.read()

old_end = "        container.innerHTML = html;\n    });"
new_end = "        container.innerHTML = html;\n        const printBtn = document.getElementById('btn-print-tab');\n        if (printBtn) printBtn.style.display = 'inline-block';\n    });"

if old_end in js:
    js = js.replace(old_end, new_end)
    with open(js_path, "w") as f:
        f.write(js)
    print("Fixed tabulation.js!")
else:
    print("Could not find old_end in tabulation.js")
