import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"

# Fix robots.txt
with open(os.path.join(base, "robots.txt"), "w") as f:
    f.write("User-agent: *\nAllow: /\n\nSitemap: https://igyr-india-get-your-result.onrender.com/sitemap.xml\n")

# Fix sitemap.xml
sitemap = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://igyr-india-get-your-result.onrender.com/</loc>
    <lastmod>2026-09-17</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://igyr-india-get-your-result.onrender.com/about.html</loc>
    <lastmod>2026-09-17</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://igyr-india-get-your-result.onrender.com/search-result.html</loc>
    <lastmod>2026-09-17</lastmod>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://igyr-india-get-your-result.onrender.com/institute-register.html</loc>
    <lastmod>2026-09-17</lastmod>
    <priority>0.7</priority>
  </url>
</urlset>
"""
with open(os.path.join(base, "sitemap.xml"), "w") as f:
    f.write(sitemap)
    
print("Fixed SEO files!")
