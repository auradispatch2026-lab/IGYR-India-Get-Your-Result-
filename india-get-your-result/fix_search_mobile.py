import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
html_path = os.path.join(base, "search-result.html")

with open(html_path, "r") as f:
    html = f.read()

# Add a specific class to the search box container
old_container = 'class="hero-container" style="flex-direction: column; justify-content: center; width: min(800px, 92%); background: white; border-radius: 20px; box-shadow: 0 20px 50px rgba(7, 29, 73, 0.1); padding: 50px; z-index: 10;"'
new_container = 'class="hero-container search-box-container"'
html = html.replace(old_container, new_container)

# We need to add .search-box-container to the CSS block!
# And also add a media query to fix the flex wrap for captcha!

new_css = """
        .search-box-container {
            flex-direction: column;
            justify-content: center;
            width: min(800px, 92%);
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(7, 29, 73, 0.1);
            padding: 50px;
            z-index: 10;
        }
        
        .captcha-row {
            display: flex;
            gap: 15px;
            align-items: center;
            margin-top: 5px;
        }

        @media (max-width: 800px) {
            #full-search-form > div {
                grid-template-columns: 1fr !important;
            }
            .search-box-container {
                padding: 25px 15px !important;
            }
            .captcha-row {
                flex-direction: column;
                align-items: stretch;
            }
            .captcha-row button {
                align-self: center;
            }
        }
    </style>
"""

html = html.replace("    </style>", new_css)

# Update the captcha row
old_captcha = '<div style="display: flex; gap: 15px; align-items: center; margin-top: 5px;">\n                <canvas'
new_captcha = '<div class="captcha-row">\n                <canvas'
html = html.replace(old_captcha, new_captcha)

with open(html_path, "w") as f:
    f.write(html)
print("Fixed search form mobile layout!")

