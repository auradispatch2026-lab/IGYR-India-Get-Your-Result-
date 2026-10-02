import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
html_path = os.path.join(base, "institute-tabulation.html")

with open(html_path, "r") as f:
    html = f.read()

# 1. Add print button
old_btns = '<button id="btn-view-tab" class="btn btn-primary">View Tabulation</button>'
new_btns = '<button id="btn-view-tab" class="btn btn-primary no-print">View Tabulation</button>\n                    <button id="btn-print-tab" class="btn no-print" style="background:#28a745; color:white; display:none;" onclick="window.print()">🖨️ Print Tabulation</button>'
if old_btns in html:
    html = html.replace(old_btns, new_btns)

# 2. Add print CSS
print_css = """
    <style>
        @media print {
            body { background: white; margin: 0; padding: 0; }
            .sidebar { display: none !important; }
            .main-content { margin-left: 0 !important; width: 100% !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .card { box-shadow: none !important; padding: 0 !important; border: none !important; margin: 0 !important; }
            h1 { display: none !important; }
            h3 { text-align: center; margin-bottom: 20px !important; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000 !important; padding: 8px !important; font-size: 12px; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            
            /* Print landscape if possible */
            @page { size: landscape; }
        }
    </style>
</head>
"""
if "</head>" in html:
    html = html.replace("</head>", print_css)

with open(html_path, "w") as f:
    f.write(html)
print("Updated HTML with Print button and CSS!")
