import re
with open("/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result/index.html", "r") as f:
    html = f.read()
    
# Extract all @media blocks
m = re.findall(r"(@media[^{]+\{[\s\S]+?\n\s*\})", html)
for b in m:
    print(b[:100] + "...\n")
