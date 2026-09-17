import re
with open("/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result/index.html", "r") as f:
    html = f.read()

m = re.findall(r".{0,100}<select[\s\S]{0,100}", html)
for match in m:
    print(match)
    print("---")
