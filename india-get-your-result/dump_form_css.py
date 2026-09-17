import re
with open("/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result/index.html", "r") as f:
    html = f.read()

print("Form Row CSS:")
print(re.search(r"\.form-row\s*\{[\s\S]*?\}", html).group(0) if re.search(r"\.form-row\s*\{[\s\S]*?\}", html) else "Not found")

print("Search Grid CSS:")
print(re.search(r"\.search-grid\s*\{[\s\S]*?\}", html).group(0) if re.search(r"\.search-grid\s*\{[\s\S]*?\}", html) else "Not found")

