import re
with open("/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result/index.html", "r") as f:
    html = f.read()

# Find the form with Select State, Select District
match = re.search(r"<form[^>]*>([\s\S]{1,1000})</form>", html)
if match:
    print(match.group(0))
else:
    print("Not found")

