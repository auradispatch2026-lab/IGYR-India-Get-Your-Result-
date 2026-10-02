import os
import re

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
html_path = os.path.join(base, "result.html")

with open(html_path, "r") as f:
    html = f.read()

old_print = """        @media print {
            body { background: #fff; padding: 0; }
            .a4-sheet { box-shadow: none; border: none; width: 100%; min-height: auto; padding: 15mm 10mm; }
            .no-print { display: none !important; }
        }"""

new_print = """        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            body { background: #fff; padding: 0; }
            .a4-sheet { box-shadow: none; border: none; width: 100%; min-height: auto; padding: 15mm 10mm; margin: 0; }
            .no-print { display: none !important; }
        }"""

if old_print in html:
    html = html.replace(old_print, new_print)
    with open(html_path, "w") as f:
        f.write(html)
    print("Fixed print styling!")
else:
    print("Could not find print block.")
