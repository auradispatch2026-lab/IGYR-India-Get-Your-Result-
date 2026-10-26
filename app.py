from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from pymongo import MongoClient
import os
import html as html_lib
from datetime import datetime
import json
import urllib.request
import urllib.error
import urllib.parse

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": ["https://igyr-india-get-your-result.onrender.com", "http://127.0.0.1:5005", "http://localhost:5005", "http://127.0.0.1:5500"]}})

# Connect to MongoDB
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://auradispatch2026_db_user:611LdmEjTS7WeqKW@cluster0.z9xcllt.mongodb.net/?appName=Cluster0")
client = MongoClient(MONGO_URI)
db = client['igyr_database']

# Collections
institutes_col = db['institutes']
results_col = db['results']
notices_col = db['notices']
quicklinks_col = db['quicklinks']
schemes_col = db['schemes']
applications_col = db['applications']
settings_col = db['settings']
fcm_tokens_col = db['fcm_tokens']
banner_col = db['banner']
whatsapp_config_col = db['whatsapp_config']
whatsapp_logs_col = db['whatsapp_logs']

# Initialize Firebase Admin SDK for FCM Web Push
import json
import firebase_admin
from firebase_admin import credentials, messaging

try:
    if not firebase_admin._apps:
        fb_creds_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        app_dir = os.path.dirname(os.path.abspath(__file__))
        sa_candidates = [
            os.path.join(app_dir, "firebase-service-account.json"),
            os.path.join(app_dir, "..", "firebase-service-account.json"),
            os.path.join(app_dir, "india-get-your-result", "firebase-service-account.json"),
            "firebase-service-account.json"
        ]
        sa_file = next((f for f in sa_candidates if os.path.isfile(f)), None)

        if fb_creds_env:
            cred = credentials.Certificate(json.loads(fb_creds_env))
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK initialized from environment variable.")
        elif sa_file:
            cred = credentials.Certificate(sa_file)
            firebase_admin.initialize_app(cred)
            print(f"✅ Firebase Admin SDK initialized from file: {sa_file}")
        else:
            print("⚠️ Firebase Admin credentials not found. Provide FIREBASE_SERVICE_ACCOUNT_JSON or firebase-service-account.json.")
except Exception as fb_init_err:
    print("⚠️ Firebase Admin SDK initialization error:", fb_init_err)

def send_push_notification_to_all(title, body, url="/search-result.html"):
    try:
        if not firebase_admin._apps:
            print("⚠️ Firebase Admin not initialized, skipping push.")
            return {"success": False, "error": "Firebase Admin not initialized"}

        tokens_docs = list(fcm_tokens_col.find({}, {"token": 1, "_id": 0}))
        tokens = [d['token'] for d in tokens_docs if d.get('token')]
        if not tokens:
            return {"success": True, "sent_count": 0, "message": "No registered devices yet."}

        success_count = 0
        failure_count = 0
        invalid_tokens = []

        full_url = url if str(url).startswith("http") else f"https://igyr-india-get-your-result.onrender.com{url}"
        icon_url = "https://igyr-india-get-your-result.onrender.com/favicon-192x192.png"
        badge_url = "https://igyr-india-get-your-result.onrender.com/favicon-96x96.png"

        chunk_size = 500
        for i in range(0, len(tokens), chunk_size):
            chunk = tokens[i:i + chunk_size]
            multicast_msg = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=str(title),
                    body=str(body),
                    image=icon_url
                ),
                data={
                    "title": str(title),
                    "body": str(body),
                    "url": str(url)
                },
                webpush=messaging.WebpushConfig(
                    headers={
                        "Urgency": "high",
                        "TTL": "86400"
                    },
                    notification=messaging.WebpushNotification(
                        title=str(title),
                        body=str(body),
                        icon=icon_url,
                        badge=badge_url,
                        vibrate=[200, 100, 200, 100, 200],
                        tag="igyr-exam-alert",
                        renotify=True,
                        require_interaction=True,
                        data={"url": str(url)}
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link=full_url
                    )
                ),
                tokens=chunk
            )
            response = messaging.send_each_for_multicast(multicast_msg)
            success_count += response.success_count
            failure_count += response.failure_count

            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    exc = resp.exception
                    err_name = exc.__class__.__name__ if exc else ''
                    err_msg = str(exc or '').lower()
                    err_code = str(getattr(exc, 'code', '')).lower()
                    # Detect uninstalled app, revoked permissions, not found, or invalid tokens
                    is_unregistered = (
                        isinstance(exc, (messaging.UnregisteredError, messaging.SenderIdMismatchError)) or
                        any(term in err_name.lower() for term in ['unregistered', 'notfound', 'invalidargument']) or
                        any(term in err_code for term in ['unregistered', 'not_found', 'not-found', 'invalid']) or
                        any(term in err_msg for term in [
                            'unregistered', 
                            'not registered', 
                            'not found', 
                            'not_found', 
                            'invalid', 
                            'mismatch', 
                            '404', 
                            '410', 
                            'entity was not found',
                            'registration-token-not-registered',
                            'invalid argument'
                        ])
                    )
                    if is_unregistered:
                        invalid_tokens.append(chunk[idx])

        if invalid_tokens:
            fcm_tokens_col.delete_many({"token": {"$in": invalid_tokens}})
            print(f"Cleaned up {len(invalid_tokens)} uninstalled / stale FCM tokens.")

        remaining_count = fcm_tokens_col.count_documents({})
        print(f"✅ FCM Broadcast: {success_count} succeeded, {failure_count} failed. Cleaned: {len(invalid_tokens)}. Active remaining: {remaining_count}")
        return {
            "success": True,
            "sent_count": success_count,
            "failure_count": failure_count,
            "cleaned_count": len(invalid_tokens),
            "total_devices": remaining_count,
            "active_subscribers": remaining_count
        }
    except Exception as e:
        print("Error sending push notification:", e)
        return {"success": False, "error": str(e)}

# Initialize demo data if collections are empty
def init_db():
    if institutes_col.count_documents({}) == 0:
        institutes_col.insert_many([
            { "id": "IGYR001", "name": "Odisha Public School", "type": "School", "status": "APPROVED", "password": "demo123", "state": "Odisha", "district": "Bhubaneswar", "address": "Plot 42, Vihar Marg" },
            { "id": "IGYR002", "name": "Delhi Modern College", "type": "College", "status": "APPROVED", "password": "demo123", "state": "Odisha", "district": "Bhubaneswar", "address": "Sec 12, South Avenue" }
        ])
    if results_col.count_documents({}) == 0:
        results_col.insert_one({
            "reg": "REG123", "roll": "ROL123", "name": "John Doe", "instId": "IGYR001", 
            "exam": "Annual 2026", "class": "10", 
            "marks": [{"sub": "Math", "max": 100, "obt": 85}, {"sub": "Science", "max": 100, "obt": 90}], 
            "vid": "IGYR-2026-000123"
        })
    if quicklinks_col.count_documents({}) == 0:
        quicklinks_col.insert_one({"links": [
            {"text": "Home", "url": "index.html"},
            {"text": "About", "url": "about.html"},
            {"text": "Results", "url": "search-result.html"},
            {"text": "Admin Login", "url": "admin-login.html"}
        ]})


    if schemes_col.count_documents({}) == 0:
        schemes_col.insert_many([
            {
                "id": "SCH_001",
                "name": "Normal Tabulation Scheme",
                "rate": "5",
                "unit": "per student",
                "badge": "Standard",
                "color": "blue",
                "features": [
                    "Standard Tabulation Register sheet generation",
                    "Printable landscape gazette for official records",
                    "Roll number & student name index",
                    "Basic verification & export"
                ],
                "desc": "Best for schools needing standard annual tabulation registers and fast record generation."
            },
            {
                "id": "SCH_002",
                "name": "Tabulation-Wise Rate Scheme",
                "rate": "8",
                "unit": "per student",
                "badge": "Popular",
                "color": "purple",
                "features": [
                    "Complete Tabulation-wise gazette generation",
                    "Digital Marksheet with Scannable Barcode",
                    "Class-wise & Exam-wise filter tabulation",
                    "Instant online result search by roll number"
                ],
                "desc": "Ideal for colleges and high schools wanting both gazette tabulation and online student marksheet access."
            },
            {
                "id": "SCH_003",
                "name": "Premium Digital & Verification Scheme",
                "rate": "12",
                "unit": "per student",
                "badge": "Complete",
                "color": "green",
                "features": [
                    "Full Tabulation Register + Digital Marksheets",
                    "Custom Institute Logo & Authorized Signatures",
                    "Unique Marksheet Verification ID (VID)",
                    "Tamper-proof online verification portal",
                    "Permanent MongoDB Cloud Archive"
                ],
                "desc": "Complete digital solution with school branding, verification security, and unlimited PDF marksheets."
            }
        ])

    if applications_col.count_documents({}) == 0:
        applications_col.insert_one({
            "id": "APP_1001",
            "name": "St. Xavier Public School",
            "type": "School",
            "state": "Odisha",
            "district": "Khordha",
            "city": "Bhubaneswar",
            "pincode": "751024",
            "email": "principal@stxavier.edu.in",
            "phone": "9876543210",
            "scheme": "Normal Tabulation Scheme",
            "schemeRate": "5",
            "status": "PENDING",
            "appliedAt": "2026-10-23 15:30"
        })

    default_privacy = """INDIA GET YOUR RESULT (IGYR) - PRIVACY POLICY
Last Updated: October 2026

1. Overview
India Get Your Result ("IGYR", "we", "our", or "platform") is committed to protecting the privacy and personal data of students, educational institutions, teachers, and visitors. This Privacy Policy outlines how we collect, store, process, and safeguard information published and accessed through our portal.

2. Information We Collect
- Student Examination Data: Registration numbers, roll numbers, candidate names, academic classes, subject marks, and grades published by verified affiliated educational institutions.
- Institutional Details: School/college name, board affiliation, contact email, administrative credentials, and verification keys.
- Technical & Log Data: IP addresses, browser types, device information, and access timestamps collected automatically for security and audit verification.

3. Use of Information
- Facilitating online access to verified examination marksheets and tabulation sheets.
- Maintaining cryptographic verification identifiers (VID) to prevent credential falsification.
- Communicating critical platform updates, system maintenance, and examination publication notices.

4. Data Protection & Security
All records are stored within protected cloud database architectures with strict role-based access control. Sensitive passwords and authentication tokens are encrypted using industry-standard hashing protocols. We never sell, rent, or trade student examination data to third-party commercial entities.

5. Cookies & Offline Storage
IGYR uses local caching (Service Workers & local storage) exclusively to enable fast offline access to examination results and ensure continuous availability.

6. Grievance Redressal
For privacy queries or data correction requests, contact the IGYR Secretariat:
- Email: support@igyr.org
- Helpline: +91 1800-889-4497
- Address: IGYR National Education Secretariat, Central IT Complex, New Delhi - 110001, India."""

    default_terms = """INDIA GET YOUR RESULT (IGYR) - TERMS & CONDITIONS
Last Updated: October 2026

1. Acceptance of Terms
By accessing or using India Get Your Result (https://igyr-india-get-your-result.onrender.com/), educational institutions, administrators, students, and parents agree to be bound by these Terms and Conditions.

2. Purpose of the Platform
IGYR provides a digital infrastructure allowing registered schools, colleges, and coaching institutions across India to digitally publish, archive, and verify examination results, tabulation registers, and student credentials.

3. Institutional Responsibilities
- Participating institutions warrant that all uploaded marks, roll numbers, and student identities are authentic and approved by their respective academic governing authorities.
- Institutions are responsible for maintaining the confidentiality of their portal credentials and passwords.

4. Student Marksheet Verification
- Online marks and digital scorecards published via IGYR are digital representations intended for immediate access and official verification.
- Every verified result is stamped with an official Verification Identifier (VID). Tampering with published results constitutes a punishable offense.

5. Intellectual Property
All platform software, user interface design, logos, brand assets, and proprietary tabulation systems are the intellectual property of India Get Your Result (IGYR) and its founder, Arnnav Panda.

6. Limitation of Liability
IGYR operates with continuous cloud uptime monitoring. While we implement high-availability safeguards, IGYR shall not be liable for localized internet interruptions or errors in raw marks submitted directly by institutions.

7. Jurisdiction & Applicable Law
These terms are governed by the laws of India. Any disputes arising out of the use of this portal shall be subject to the exclusive jurisdiction of the competent courts in India."""

    if settings_col.count_documents({}) == 0:
        settings_col.insert_one({
            "id": "system_settings",
            "supportEmail": "support@igyr.org",
            "helplinePhone": "+91 1800-889-4497",
            "supportHours": "Monday - Saturday: 9:00 AM - 6:00 PM IST",
            "officeAddress": "IGYR National Education Secretariat, Central IT Complex, New Delhi - 110001, India",
            "helpCenterUrl": "about.html#contact",
            "whatsappSupport": "+91 98765 43210",
            "contactHeading": "Support & Contact",
            "contactSubtext": "Official 24/7 Educational Grievance & Technical Assistance Helpline",
            "privacyPolicy": default_privacy,
            "termsConditions": default_terms
        })
    else:
        existing = settings_col.find_one({"id": "system_settings"})
        if existing:
            updates = {}
            if "privacyPolicy" not in existing or not existing["privacyPolicy"]:
                updates["privacyPolicy"] = default_privacy
            if "termsConditions" not in existing or not existing["termsConditions"]:
                updates["termsConditions"] = default_terms
            if updates:
                settings_col.update_one({"id": "system_settings"}, {"$set": updates})

    if banner_col.count_documents({}) == 0:
        banner_col.insert_one({
            "id": "global_banner",
            "enabled": True,
            "badge": "📢 OFFICIAL ANNOUNCEMENT",
            "title": "Welcome to India Get Your Result (IGYR) Portal",
            "message": "Welcome to the National Examination Result & Digital Marksheet Verification Portal. Students can search online marksheets, verify digital scorecards, and access government scholarship schemes directly from verified educational institutions across India.",
            "buttonText": "Search Results Now →",
            "buttonUrl": "/search-result.html",
            "showOncePerSession": True,
            "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

init_db()


@app.route('/health')
def health_check():
    return jsonify({"status": "ok", "message": "IGYR Backend is running smoothly."}), 200

def get_asset_folder(filename):
    app_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = ['.', app_dir, os.path.join('.', 'india-get-your-result'), os.path.join(app_dir, 'india-get-your-result')]
    for folder in candidates:
        abs_folder = os.path.abspath(folder)
        if os.path.isfile(os.path.join(abs_folder, filename)):
            return abs_folder
    return os.path.abspath('.')


@app.route('/')
def index():
    folder = get_asset_folder('index.html')
    file_path = os.path.join(folder, 'index.html')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        settings_doc = settings_col.find_one({"id": "system_settings"}, {'_id': 0})
        policy_text = (settings_doc.get('privacyPolicy') if settings_doc else None)
        if policy_text:
            safe_policy = html_lib.escape(policy_text)
            target = 'id="front-policy-display" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; font-size: 14px; line-height: 1.8; color: #334155; white-space: pre-wrap; word-break: break-word; max-height: 380px; overflow-y: auto; font-family: \'Inter\', -apple-system, sans-serif;">Loading legal policies...</div>'
            replacement = f'id="front-policy-display" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; font-size: 14px; line-height: 1.8; color: #334155; white-space: pre-wrap; word-break: break-word; max-height: 380px; overflow-y: auto; font-family: \'Inter\', -apple-system, sans-serif;">{safe_policy}</div>'
            content = content.replace(target, replacement)
        res = make_response(content)
        res.headers['Content-Type'] = 'text/html; charset=utf-8'
        res.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return res
    except Exception:
        return send_from_directory(folder, 'index.html')

@app.route('/favicon.ico')
def favicon():
    folder = get_asset_folder('favicon.ico')
    return send_from_directory(folder, 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/favicon.png')
def favicon_png():
    folder = get_asset_folder('favicon.png')
    return send_from_directory(folder, 'favicon.png', mimetype='image/png')

@app.route('/favicon-48x48.png')
def favicon_48():
    folder = get_asset_folder('favicon-48x48.png')
    return send_from_directory(folder, 'favicon-48x48.png', mimetype='image/png')

@app.route('/favicon-96x96.png')
def favicon_96():
    folder = get_asset_folder('favicon-96x96.png')
    return send_from_directory(folder, 'favicon-96x96.png', mimetype='image/png')

@app.route('/favicon-192x192.png')
def favicon_192():
    folder = get_asset_folder('favicon-192x192.png')
    return send_from_directory(folder, 'favicon-192x192.png', mimetype='image/png')

@app.route('/favicon-512x512.png')
def favicon_512():
    folder = get_asset_folder('favicon-512x512.png')
    return send_from_directory(folder, 'favicon-512x512.png', mimetype='image/png')

@app.route('/apple-touch-icon.png')
def apple_touch_icon():
    folder = get_asset_folder('apple-touch-icon.png')
    return send_from_directory(folder, 'apple-touch-icon.png', mimetype='image/png')

@app.route('/site.webmanifest')
def webmanifest():
    folder = get_asset_folder('site.webmanifest')
    return send_from_directory(folder, 'site.webmanifest', mimetype='application/manifest+json')

@app.route('/sitemap.xml')
def sitemap():
    folder = get_asset_folder('sitemap.xml')
    res = send_from_directory(folder, 'sitemap.xml', mimetype='application/xml')
    res.headers['Cache-Control'] = 'public, max-age=3600'
    return res

@app.route('/robots.txt')
def robots():
    folder = get_asset_folder('robots.txt')
    res = send_from_directory(folder, 'robots.txt', mimetype='text/plain')
    res.headers['Cache-Control'] = 'public, max-age=3600'
    return res

@app.route('/sw.js')
def service_worker():
    folder = get_asset_folder('sw.js')
    res = send_from_directory(folder, 'sw.js', mimetype='application/javascript')
    res.headers['Service-Worker-Allowed'] = '/'
    res.headers['Cache-Control'] = 'no-cache'
    return res

@app.route('/firebase-messaging-sw.js')
def firebase_messaging_sw():
    folder = get_asset_folder('firebase-messaging-sw.js')
    res = send_from_directory(folder, 'firebase-messaging-sw.js', mimetype='application/javascript')
    res.headers['Service-Worker-Allowed'] = '/'
    res.headers['Cache-Control'] = 'no-cache'
    return res

@app.route('/pwa-install.js')
@app.route('/js/pwa-install.js')
def pwa_install_script():
    for rel_path in ['pwa-install.js', os.path.join('js', 'pwa-install.js')]:
        folder = get_asset_folder(rel_path)
        file_path = os.path.join(folder, rel_path)
        if os.path.isfile(file_path):
            dir_name = os.path.dirname(file_path)
            base_name = os.path.basename(file_path)
            res = send_from_directory(dir_name, base_name, mimetype='application/javascript')
            res.headers['Cache-Control'] = 'no-cache'
            return res
    res = send_from_directory('.', 'pwa-install.js', mimetype='application/javascript')
    res.headers['Cache-Control'] = 'no-cache'
    return res

@app.route('/announcement-banner.js')
@app.route('/js/announcement-banner.js')
def announcement_banner_script():
    for rel_path in ['announcement-banner.js', os.path.join('js', 'announcement-banner.js')]:
        folder = get_asset_folder(rel_path)
        file_path = os.path.join(folder, rel_path)
        if os.path.isfile(file_path):
            dir_name = os.path.dirname(file_path)
            base_name = os.path.basename(file_path)
            res = send_from_directory(dir_name, base_name, mimetype='application/javascript')
            res.headers['Cache-Control'] = 'no-cache, must-revalidate'
            return res
    res = send_from_directory('.', 'announcement-banner.js', mimetype='application/javascript')
    res.headers['Cache-Control'] = 'no-cache, must-revalidate'
    return res

@app.route('/privacy.html')
@app.route('/privacy')
def privacy_page():
    folder = get_asset_folder('privacy.html')
    file_path = os.path.join(folder, 'privacy.html')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        settings_doc = settings_col.find_one({"id": "system_settings"}, {'_id': 0})
        policy_text = (settings_doc.get('privacyPolicy') if settings_doc else None)
        if policy_text:
            safe_policy = html_lib.escape(policy_text)
            content = content.replace('id="policy-content" class="policy-text">Loading official Privacy Policy...</div>',
                                      f'id="policy-content" class="policy-text">{safe_policy}</div>')
        res = make_response(content)
        res.headers['Content-Type'] = 'text/html; charset=utf-8'
        res.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return res
    except Exception:
        return send_from_directory(folder, 'privacy.html')

@app.route('/terms.html')
@app.route('/terms')
def terms_page():
    folder = get_asset_folder('terms.html')
    file_path = os.path.join(folder, 'terms.html')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        settings_doc = settings_col.find_one({"id": "system_settings"}, {'_id': 0})
        terms_text = (settings_doc.get('termsConditions') if settings_doc else None)
        if terms_text:
            safe_terms = html_lib.escape(terms_text)
            content = content.replace('id="policy-content" class="policy-text">Loading official Terms &amp; Conditions...</div>',
                                      f'id="policy-content" class="policy-text">{safe_terms}</div>')
        res = make_response(content)
        res.headers['Content-Type'] = 'text/html; charset=utf-8'
        res.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return res
    except Exception:
        return send_from_directory(folder, 'terms.html')


@app.route('/institute-login.html')
@app.route('/institute-login')
def institute_login_removed():
    html_404 = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>404 Not Found - IGYR</title>
    <!-- Favicon & Touch Icons -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #071d49; text-align: center; padding: 80px 20px; margin: 0; }
        .box { max-width: 520px; margin: 0 auto; background: white; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        h1 { font-size: 56px; margin: 0 0 10px; color: #1e3a8a; font-weight: 800; }
        h2 { font-size: 22px; margin: 0 0 15px; color: #1e293b; font-weight: 700; }
        p { color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 30px; }
        a { display: inline-block; background: #1266d6; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; transition: background 0.2s; }
        a:hover { background: #0c4da3; }
    </style>
</head>
<body>
    <div class="box">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The Institute Login portal is not available and has been permanently removed.</p>
        <a href="/">← Return to Homepage</a>
    </div>
</body>
</html>"""
    return (html_404, 404)





@app.route('/api/auth/admin', methods=['POST'])
def admin_login():
    data = request.json
    # The secure password is ONLY stored here on the server
    if data and data.get('username') == 'admin' and data.get('password') == 'cutiee':
        return jsonify({"success": True, "token": "igyr_super_secret_auth_token_8829"}), 200
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/auth/institute', methods=['POST'])
def institute_login():
    data = request.json
    inst_id = data.get('id')
    password = data.get('password')
    inst = institutes_col.find_one({"id": inst_id, "password": password})
    if inst:
        return jsonify({"success": True, "token": "igyr_inst_secret_auth_token_7731"}), 200
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

_sync_cache = None
_sync_cache_time = 0
CACHE_TTL = 15  # Serve from in-memory cache for up to 15s (1,000x faster, prevents server hanging)

def invalidate_sync_cache():
    global _sync_cache
    _sync_cache = None

# API Routes for Initial Sync
@app.route('/api/sync', methods=['GET'])
def sync_data():
    global _sync_cache, _sync_cache_time
    now = time.time()
    
    # Return in-memory cache if fresh (instant 1ms response, 0 DB roundtrips)
    if _sync_cache is not None and (now - _sync_cache_time) < CACHE_TTL:
        return jsonify(_sync_cache)

    try:
        institutes = list(institutes_col.find({}, {'_id': 0}))
        for inst in institutes:
            inst.pop('password', None)
        results = list(results_col.find({}, {'_id': 0}))
        notices = list(notices_col.find({}, {'_id': 0}))
        
        ql_doc = quicklinks_col.find_one({}, {'_id': 0})
        quicklinks = ql_doc['links'] if ql_doc and 'links' in ql_doc else []
        schemes = list(schemes_col.find({}, {'_id': 0}))
        applications = list(applications_col.find({}, {'_id': 0}))
        
        settings_doc = settings_col.find_one({"id": "system_settings"}, {'_id': 0})
        if not settings_doc:
            settings_doc = settings_col.find_one({}, {'_id': 0}) or {
                "id": "system_settings",
                "supportEmail": "support@igyr.org",
                "helplinePhone": "+91 1800-889-4497",
                "supportHours": "Monday - Saturday: 9:00 AM - 6:00 PM IST",
                "officeAddress": "IGYR National Education Secretariat, Central IT Complex, New Delhi - 110001, India",
                "helpCenterUrl": "about.html#contact",
                "whatsappSupport": "+91 98765 43210",
                "contactHeading": "Support & Contact",
                "contactSubtext": "Official 24/7 Educational Grievance & Technical Assistance Helpline"
            }

        banner_doc = banner_col.find_one({"id": "global_banner"}, {'_id': 0}) or {
            "id": "global_banner",
            "enabled": False,
            "badge": "📢 OFFICIAL ANNOUNCEMENT",
            "title": "Welcome to IGYR",
            "message": "Welcome to India Get Your Result Portal.",
            "buttonText": "Explore Portal",
            "buttonUrl": "/search-result.html",
            "showOncePerSession": True,
            "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        _sync_cache = {
            "institutes": institutes,
            "results": results,
            "notices": notices,
            "quicklinks": quicklinks,
            "schemes": schemes,
            "applications": applications,
            "settings": settings_doc,
            "banner": banner_doc
        }
        _sync_cache_time = now
        return jsonify(_sync_cache)
    except Exception as e:
        if _sync_cache is not None:
            return jsonify(_sync_cache)
        return jsonify({"error": str(e)}), 500



def verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    # Accept both super admin and institute tokens for saving data
    return token in ["igyr_super_secret_auth_token_8829", "igyr_inst_secret_auth_token_7731"]

# API Routes for saving data

@app.route('/api/institutes', methods=['POST'])
def save_institutes():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    if data:
        # Preserve existing passwords since the frontend doesn't have them anymore!
        existing_insts = { i['id']: i.get('password', 'demo123') for i in institutes_col.find({}) }
        for inst in data:
            if inst['id'] in existing_insts:
                inst['password'] = existing_insts[inst['id']]
            elif 'password' not in inst:
                inst['password'] = 'demo123' # Default for new institutes
        institutes_col.delete_many({})
        institutes_col.insert_many(data)
    invalidate_sync_cache()
    return jsonify({"status": "success"})

@app.route('/api/results', methods=['POST'])
def save_results():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    results_col.delete_many({})
    if data:
        results_col.insert_many(data)
        # Automatic FCM Push Alert to all subscribed phones / browsers
        try:
            sample = data[0] if len(data) > 0 else {}
            exam_name = sample.get('exam', 'Examination')
            inst_id = sample.get('instId', '')
            inst_doc = institutes_col.find_one({"id": inst_id}) if inst_id else None
            inst_name = inst_doc.get('name') if inst_doc else "Educational Institution"

            send_push_notification_to_all(
                title=f"🎯 {exam_name} Result Declared!",
                body=f"{inst_name} has published online marksheets and digital scorecards. Check your result now!",
                url="/search-result.html"
            )
        except Exception as push_err:
            print("Auto push notification failed:", push_err)
    invalidate_sync_cache()
    return jsonify({"status": "success"})

@app.route('/api/notices', methods=['POST'])
def save_notices():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    notices_col.delete_many({})
    if data:
        notices_col.insert_many(data)
    invalidate_sync_cache()
    return jsonify({"status": "success"})

@app.route('/api/quicklinks', methods=['POST'])
def save_quicklinks():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    quicklinks_col.delete_many({})
    quicklinks_col.insert_one({"links": data})
    invalidate_sync_cache()
    return jsonify({"status": "success"})

@app.route('/api/schemes', methods=['POST'])
def save_schemes():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    schemes_col.delete_many({})
    if data:
        schemes_col.insert_many(data)
    invalidate_sync_cache()
    return jsonify({"status": "success"})


import time
from datetime import datetime

@app.route('/api/applications', methods=['POST'])
def submit_application():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    app_id = f"APP_{int(time.time())}"
    data['id'] = app_id
    if 'status' not in data:
        data['status'] = 'PENDING'
    if 'appliedAt' not in data:
        data['appliedAt'] = datetime.now().strftime("%Y-%m-%d %H:%M")
        
    applications_col.insert_one(data)
    data.pop('_id', None)
    invalidate_sync_cache()
    return jsonify({"status": "success", "message": "Application submitted successfully", "application": data}), 201

@app.route('/api/applications/save-all', methods=['POST'])
def save_all_applications():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    applications_col.delete_many({})
    if data:
        applications_col.insert_many(data)
    invalidate_sync_cache()
    return jsonify({"status": "success"})

@app.route('/api/settings', methods=['POST'])
def save_settings():
    if not verify_token(): return jsonify({"error": "Unauthorized"}), 401
    data = request.json or {}
    data['id'] = 'system_settings'
    settings_col.delete_many({})
    settings_col.insert_one(data)
    data.pop('_id', None)
    invalidate_sync_cache()
    return jsonify({"status": "success", "settings": data})

# =====================================================
# FULL-SCREEN ANNOUNCEMENT BANNER ENDPOINTS
# =====================================================

@app.route('/api/banner', methods=['GET'])
def get_banner():
    banner_doc = banner_col.find_one({"id": "global_banner"}, {'_id': 0})
    if not banner_doc:
        banner_doc = {
            "id": "global_banner",
            "enabled": False,
            "badge": "📢 OFFICIAL ANNOUNCEMENT",
            "title": "Welcome to IGYR",
            "message": "Welcome to India Get Your Result Portal.",
            "buttonText": "Explore Portal",
            "buttonUrl": "/search-result.html",
            "showOncePerSession": True,
            "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    return jsonify(banner_doc), 200

@app.route('/api/admin/banner', methods=['POST'])
def save_banner():
    if not verify_token():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    banner_data = {
        "id": "global_banner",
        "enabled": bool(data.get('enabled', False)),
        "badge": str(data.get('badge') or "📢 OFFICIAL ANNOUNCEMENT").strip(),
        "title": str(data.get('title') or "Official Notice").strip(),
        "message": str(data.get('message') or "").strip(),
        "buttonText": str(data.get('buttonText') or "View Details →").strip(),
        "buttonUrl": str(data.get('buttonUrl') or "/search-result.html").strip(),
        "showOncePerSession": bool(data.get('showOncePerSession', True)),
        "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    banner_col.update_one({"id": "global_banner"}, {"$set": banner_data}, upsert=True)
    invalidate_sync_cache()
    return jsonify({"success": True, "banner": banner_data}), 200

# =====================================================
# FCM NOTIFICATION API ENDPOINTS
# =====================================================

@app.route('/api/notifications/subscribe', methods=['POST'])
def subscribe_notifications():
    data = request.json or {}
    token = data.get('token')
    if not token or not isinstance(token, str) or len(token) < 10:
        return jsonify({"error": "Valid FCM token is required"}), 400

    fcm_tokens_col.update_one(
        {"token": token},
        {"$set": {
            "token": token,
            "device": data.get('device', 'Unknown Browser'),
            "platform": data.get('platform', 'Unknown'),
            "updatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }},
        upsert=True
    )
    return jsonify({"success": True, "message": "Device subscribed successfully."}), 200

@app.route('/api/notifications/unsubscribe', methods=['POST'])
def unsubscribe_notification():
    data = request.json or {}
    token = data.get('token')
    if not token:
        return jsonify({"error": "No token provided"}), 400
    res = fcm_tokens_col.delete_many({"token": token})
    remaining = fcm_tokens_col.count_documents({})
    return jsonify({
        "success": True,
        "deleted_count": res.deleted_count,
        "total_subscribers": remaining
    }), 200

@app.route('/api/admin/notifications/stats', methods=['GET'])
def get_notification_stats():
    count = fcm_tokens_col.count_documents({})
    return jsonify({"success": True, "total_subscribers": count}), 200

@app.route('/api/admin/notifications/sync-subscribers', methods=['POST'])
def sync_notification_subscribers():
    if not verify_token():
        return jsonify({"error": "Unauthorized"}), 401

    if not firebase_admin._apps:
        return jsonify({"error": "Firebase Admin not initialized"}), 500

    tokens_docs = list(fcm_tokens_col.find({}, {"token": 1, "_id": 0}))
    tokens = [d['token'] for d in tokens_docs if d.get('token')]
    if not tokens:
        return jsonify({"success": True, "total_subscribers": 0, "cleaned_count": 0}), 200

    invalid_tokens = []
    chunk_size = 500
    for i in range(0, len(tokens), chunk_size):
        chunk = tokens[i:i + chunk_size]
        multicast_msg = messaging.MulticastMessage(
            data={"sync": "1"},
            tokens=chunk
        )
        try:
            # dry_run=True validates against Google FCM servers without sending any notification to devices
            response = messaging.send_each_for_multicast(multicast_msg, dry_run=True)
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    exc = resp.exception
                    err_name = exc.__class__.__name__ if exc else ''
                    err_msg = str(exc or '').lower()
                    err_code = str(getattr(exc, 'code', '')).lower()
                    is_unregistered = (
                        isinstance(exc, (messaging.UnregisteredError, messaging.SenderIdMismatchError)) or
                        any(term in err_name.lower() for term in ['unregistered', 'notfound', 'invalidargument']) or
                        any(term in err_code for term in ['unregistered', 'not_found', 'not-found', 'invalid']) or
                        any(term in err_msg for term in [
                            'unregistered', 'not registered', 'not found', 'not_found',
                            'invalid', 'mismatch', '404', '410', 'entity was not found',
                            'registration-token-not-registered', 'invalid argument'
                        ])
                    )
                    if is_unregistered:
                        invalid_tokens.append(chunk[idx])
        except Exception as sync_err:
            print("Sync multicast error:", sync_err)

    if invalid_tokens:
        fcm_tokens_col.delete_many({"token": {"$in": invalid_tokens}})
        print(f"Sync: Cleaned up {len(invalid_tokens)} uninstalled / stale subscriber tokens.")

    remaining = fcm_tokens_col.count_documents({})
    return jsonify({
        "success": True,
        "total_subscribers": remaining,
        "cleaned_count": len(invalid_tokens)
    }), 200

@app.route('/api/admin/broadcast-notification', methods=['POST'])
def admin_broadcast_notification():
    if not verify_token():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    title = data.get('title') or "IGYR Official Notice"
    body = data.get('body') or "A new examination notice has been published on the portal."
    url = data.get('url') or "/search-result.html"

    res = send_push_notification_to_all(title=title, body=body, url=url)
    return jsonify(res), (200 if res.get('success') else 500)


# =========================================================
# WHATSAPP BUSINESS CLOUD API WEBHOOK & AUTOMATION ENGINE
# =========================================================
WHATSAPP_DEFAULT_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "igyr_whatsapp_webhook_2026")

def get_whatsapp_config():
    cfg = {
        "verify_token": os.environ.get("WHATSAPP_VERIFY_TOKEN", WHATSAPP_DEFAULT_VERIFY_TOKEN),
        "token": os.environ.get("WHATSAPP_TOKEN") or os.environ.get("WHATSAPP_ACCESS_TOKEN", ""),
        "phone_number_id": os.environ.get("WHATSAPP_PHONE_NUMBER_ID", ""),
        "auto_reply_enabled": True
    }
    try:
        saved = whatsapp_config_col.find_one({"id": "whatsapp_config"}, {"_id": 0})
        if saved:
            if saved.get("verify_token"):
                cfg["verify_token"] = saved["verify_token"]
            if saved.get("token"):
                cfg["token"] = saved["token"]
            if saved.get("phone_number_id"):
                cfg["phone_number_id"] = saved["phone_number_id"]
            if "auto_reply_enabled" in saved:
                cfg["auto_reply_enabled"] = bool(saved["auto_reply_enabled"])
    except Exception as e:
        print("Error fetching WhatsApp config:", e)
    return cfg

def send_whatsapp_message(to_phone, message_text, token=None, phone_number_id=None):
    cfg = get_whatsapp_config()
    token = token or cfg.get('token')
    phone_number_id = phone_number_id or cfg.get('phone_number_id')

    if not token or not phone_number_id:
        return {
            "success": False,
            "error": "WhatsApp Access Token or Phone Number ID not configured."
        }

    # Clean phone number (keep digits only)
    clean_phone = "".join(filter(str.isdigit, str(to_phone or "")))
    if len(clean_phone) == 10:
        clean_phone = "91" + clean_phone

    if not clean_phone:
        return {"success": False, "error": "Invalid recipient phone number."}

    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_phone,
        "type": "text",
        "text": {
            "preview_url": True,
            "body": message_text
        }
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            resp_data = json.loads(resp.read().decode('utf-8'))
            return {"success": True, "data": resp_data}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"WhatsApp Cloud API Error ({e.code}): {err_body}")
        try:
            parsed_err = json.loads(err_body)
            msg = parsed_err.get('error', {}).get('message', err_body)
        except Exception:
            msg = err_body
        return {"success": False, "error": msg, "code": e.code}
    except Exception as e:
        print("WhatsApp dispatch exception:", e)
        return {"success": False, "error": str(e)}

def build_whatsapp_automated_response(incoming_text, sender_name="User"):
    raw = (incoming_text or "").strip()
    text = raw.lower()

    # 1. Result Query (e.g. "RESULT 101", "Roll 101", "101", "IGYR001")
    words = raw.split()
    query_val = None
    if len(words) >= 2 and words[0].lower() in ["result", "roll", "reg", "vid"]:
        query_val = words[1].strip()
    elif len(words) == 1 and (words[0].isdigit() or (words[0].isalnum() and len(words[0]) >= 4 and any(c.isdigit() for c in words[0]))):
        # Ignore common non-roll keywords
        if words[0].lower() not in ["help", "info", "menu", "start", "schemes", "scheme", "about"]:
            query_val = words[0].strip()

    if query_val:
        regex_query = {"$regex": f"^{query_val}$", "$options": "i"}
        res = results_col.find_one({
            "$or": [
                {"roll": regex_query},
                {"reg": regex_query},
                {"vid": regex_query}
            ]
        })

        if res:
            name = res.get('name', 'N/A')
            roll = res.get('roll', 'N/A')
            reg = res.get('reg', 'N/A')
            exam = res.get('exam', 'N/A')
            date = res.get('date', 'Recently')
            vid = res.get('vid', 'IGYR-VERIFIED')
            status = res.get('status', 'PUBLISHED')

            inst = institutes_col.find_one({"id": res.get('instId')})
            inst_name = inst.get('name', 'Affiliated Institution') if inst else 'Affiliated Institution'

            if status == 'PUBLISHED':
                marks_list = res.get('marks', [])
                marks_text = ""
                total_obt = 0
                total_max = 0
                if isinstance(marks_list, list) and marks_list:
                    for m in marks_list[:6]:
                        sub = m.get('sub', 'Subject')
                        obt = m.get('obt', 0)
                        mx = m.get('max', 100)
                        try:
                            total_obt += float(obt)
                            total_max += float(mx)
                        except Exception:
                            pass
                        marks_text += f"• {sub}: {obt}/{mx}\n"

                score_summary = f"\n*Marks Breakdown:*\n{marks_text}*Total:* {int(total_obt)}/{int(total_max)}\n" if marks_text else ""

                return (
                    f"🎯 *IGYR Official Examination Result* 🎯\n\n"
                    f"👤 *Candidate Name:* {name}\n"
                    f"📝 *Roll Number:* {roll}\n"
                    f"🎫 *Registration No:* {reg}\n"
                    f"🏫 *Institution:* {inst_name}\n"
                    f"📋 *Examination:* {exam}\n"
                    f"📅 *Declared Date:* {date}\n"
                    f"📊 *Result Status:* ✅ *PUBLISHED*\n"
                    f"🔐 *Verification VID:* {vid}\n"
                    f"{score_summary}\n"
                    f"🌐 *View & Download Official Digital Marksheet:*\n"
                    f"https://igyr-india-get-your-result.onrender.com/search-result.html\n\n"
                    f"_India Get Your Result (IGYR) - National Education Secretariat_"
                )
            else:
                return (
                    f"⏳ *Examination Result Under Verification* ⏳\n\n"
                    f"👤 *Candidate Name:* {name}\n"
                    f"📝 *Roll Number:* {roll}\n"
                    f"🏫 *Institution:* {inst_name}\n"
                    f"📋 *Examination:* {exam}\n"
                    f"📊 *Current Status:* ⏳ *UNDER COMPILATION / DRAFT*\n\n"
                    f"Your affiliated institution has uploaded examination records and is conducting final verification. Your marksheet will be published online as soon as approved.\n\n"
                    f"👉 Check back on the portal anytime:\n"
                    f"https://igyr-india-get-your-result.onrender.com/search-result.html"
                )
        else:
            return (
                f"🔍 *Result Search Notice*\n\n"
                f"No published result found matching: *{query_val}*.\n\n"
                f"💡 *Helpful Tips:*\n"
                f"1. Please verify your Roll Number or Registration No.\n"
                f"2. Confirm that your affiliated school/college has published this exam.\n\n"
                f"👉 Search directly on the official portal:\n"
                f"https://igyr-india-get-your-result.onrender.com/search-result.html\n\n"
                f"Send *HELP* to connect with support."
            )

    # 2. Notices & Announcements Query
    if any(k in text for k in ["notice", "notices", "announcement", "announcements", "alert", "alerts", "news"]):
        notices = list(notices_col.find({}, {'_id': 0}))
        if notices:
            n_text = ""
            for idx, n in enumerate(notices[-3:], 1):
                t_badge = "🔴 URGENT" if n.get('type') == 'urgent' else "🟠 WARNING" if n.get('type') == 'warning' else "🔵 INFO"
                n_text += f"{idx}. [{t_badge}] {n.get('text', '')} ({n.get('date', 'Recent')})\n\n"
            return (
                f"📢 *Latest IGYR Official Announcements* 📢\n\n"
                f"{n_text.strip()}\n\n"
                f"🌐 *View All Portal Notices:*\n"
                f"https://igyr-india-get-your-result.onrender.com/#notices"
            )
        else:
            return (
                f"📢 *IGYR Notices*\n\n"
                f"No active urgent alerts at this moment.\n"
                f"Visit the portal: https://igyr-india-get-your-result.onrender.com/#notices"
            )

    # 3. Help, Support & Contact Query
    if any(k in text for k in ["help", "support", "contact", "phone", "email", "helpline", "call", "address"]):
        s = settings_col.find_one({"id": "system_settings"}) or {}
        email = s.get('supportEmail', 'indiagetyourresult@gmail.com')
        phone = s.get('helplinePhone', '+91 6371132482')
        hours = s.get('supportHours', 'Mon - Sat: 3:00 PM - 10:00 PM IST')
        address = s.get('officeAddress', 'IGYR National Education Secretariat, Central IT Complex, New Delhi - 110001, India')
        return (
            f"📞 *IGYR Official Support & Helpline* 📞\n\n"
            f"Official assistance for students, parents, and institutions:\n\n"
            f"☎️ *Helpline Phone:* {phone}\n"
            f"📧 *Official Email:* {email}\n"
            f"🕒 *Working Hours:* {hours}\n"
            f"📍 *Secretariat:* {address}\n\n"
            f"🌐 *Help Center:* https://igyr-india-get-your-result.onrender.com/about.html#contact"
        )

    # 4. Schemes & Pricing Query
    if any(k in text for k in ["scheme", "schemes", "rate", "rates", "price", "pricing", "cost", "register"]):
        return (
            f"📑 *IGYR Examination Tabulation Schemes* 📑\n\n"
            f"Digital tabulation and marksheet hosting solutions for educational institutions:\n\n"
            f"1️⃣ *Normal Tabulation Scheme:* ₹6 per student\n"
            f"2️⃣ *Tabulation-Wise Rate Scheme:* ₹8 per student\n"
            f"3️⃣ *Premium Digital & Verification Scheme:* ₹10 per student\n\n"
            f"📝 *Submit Institution Application Online:*\n"
            f"https://igyr-india-get-your-result.onrender.com/schemes.html"
        )

    # 5. Default Greeting & Menu
    first_name = (sender_name or "Student").split()[0]
    return (
        f"👋 *Namaste {first_name}! Welcome to India Get Your Result (IGYR)* 🇮🇳\n"
        f"_India's trusted digital platform for educational examination results & marksheet verification._\n\n"
        f"How can we assist you today? Please reply with a keyword:\n\n"
        f"• *RESULT <Roll No>* — Check examination marksheet instantly (e.g. `RESULT 101`)\n"
        f"• *NOTICE* — View latest portal announcements & exam circulars\n"
        f"• *HELP* — Connect with official student grievance helpline\n"
        f"• *SCHEMES* — Review institutional tabulation plans & rates\n\n"
        f"🌐 *Visit Official Portal:* https://igyr-india-get-your-result.onrender.com/"
    )


# ---------------------------------------------------------
# META WHATSAPP WEBHOOK ROUTES (GET for verification, POST for events)
# ---------------------------------------------------------
@app.route('/api/whatsapp/webhook', methods=['GET', 'POST'])
@app.route('/api/whatsapp/webhook/', methods=['GET', 'POST'])
def whatsapp_webhook():
    if request.method == 'GET':
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')

        cfg = get_whatsapp_config()
        expected_token = cfg.get('verify_token') or WHATSAPP_DEFAULT_VERIFY_TOKEN

        if mode == 'subscribe' and token == expected_token:
            print(f"✅ Meta WhatsApp Webhook verified successfully! challenge={challenge}")
            # Meta requires the challenge string back as plain text with 200 OK
            return str(challenge), 200
        else:
            print(f"❌ Meta WhatsApp Webhook verification mismatch: received '{token}', expected '{expected_token}'")
            return "Verification token mismatch", 403

    # POST: Incoming Webhook Event from Meta
    data = request.json or {}

    try:
        entries = data.get('entry', [])
        for entry in entries:
            changes = entry.get('changes', [])
            for change in changes:
                value = change.get('value', {})
                messages = value.get('messages', [])
                contacts = value.get('contacts', [])
                contact_name = "User"
                if contacts and isinstance(contacts, list):
                    contact_name = contacts[0].get('profile', {}).get('name', 'User')

                for msg in messages:
                    from_phone = msg.get('from')
                    msg_type = msg.get('type')
                    msg_id = msg.get('id')
                    body_text = ""
                    if msg_type == 'text':
                        body_text = msg.get('text', {}).get('body', '')
                    elif msg_type == 'button':
                        body_text = msg.get('button', {}).get('text', '')
                    elif msg_type == 'interactive':
                        interactive = msg.get('interactive', {})
                        body_text = (
                            interactive.get('button_reply', {}).get('title') or
                            interactive.get('list_reply', {}).get('title') or ""
                        )

                    if from_phone and body_text:
                        print(f"📩 Incoming WhatsApp from {from_phone} ({contact_name}): {body_text}")

                        # Generate Automated Response
                        reply_text = build_whatsapp_automated_response(body_text, sender_name=contact_name)

                        log_entry = {
                            "from": from_phone,
                            "sender_name": contact_name,
                            "incoming_message": body_text,
                            "reply_message": reply_text,
                            "message_id": msg_id,
                            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                            "epoch": int(datetime.utcnow().timestamp())
                        }

                        cfg = get_whatsapp_config()
                        if cfg.get("auto_reply_enabled", True) and cfg.get("token") and cfg.get("phone_number_id"):
                            dispatch_res = send_whatsapp_message(from_phone, reply_text)
                            log_entry["dispatch_status"] = "SENT" if dispatch_res.get("success") else "FAILED"
                            log_entry["dispatch_error"] = dispatch_res.get("error")
                        else:
                            log_entry["dispatch_status"] = "SIMULATED_NO_META_TOKEN"

                        try:
                            whatsapp_logs_col.insert_one(log_entry)
                        except Exception as log_err:
                            print("Error logging WhatsApp message:", log_err)

    except Exception as parse_err:
        print("Error processing WhatsApp webhook payload:", parse_err)

    # Meta requires a 200 OK response immediately
    return jsonify({"status": "EVENT_RECEIVED"}), 200


# ---------------------------------------------------------
# ADMIN WHATSAPP AUTOMATION MANAGEMENT APIS
# ---------------------------------------------------------
@app.route('/api/admin/whatsapp/config', methods=['GET'])
def get_admin_whatsapp_config():
    if not verify_token():
        return jsonify({"error": "Unauthorized"}), 401

    cfg = get_whatsapp_config()
    # Mask token for security
    raw_token = cfg.get("token") or ""
    masked_token = (raw_token[:6] + "..." + raw_token[-4:]) if len(raw_token) > 12 else ("Configured" if raw_token else "")

    # Get recent 20 message logs
    recent_logs = []
    try:
        logs = list(whatsapp_logs_col.find({}, {"_id": 0}).sort("epoch", -1).limit(20))
        recent_logs = logs
    except Exception:
        pass

    return jsonify({
        "success": True,
        "webhook_url": "https://igyr-india-get-your-result.onrender.com/api/whatsapp/webhook",
        "verify_token": cfg.get("verify_token"),
        "phone_number_id": cfg.get("phone_number_id"),
        "is_token_set": bool(raw_token),
        "masked_token": masked_token,
        "auto_reply_enabled": cfg.get("auto_reply_enabled", True),
        "logs": recent_logs
    })


@app.route('/api/admin/whatsapp/config', methods=['POST'])
def save_admin_whatsapp_config():
    if not verify_token():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    verify_token = (data.get('verify_token') or "").strip() or WHATSAPP_DEFAULT_VERIFY_TOKEN
    phone_number_id = (data.get('phone_number_id') or "").strip()
    token = (data.get('token') or "").strip()
    auto_reply_enabled = bool(data.get('auto_reply_enabled', True))

    doc = {
        "id": "whatsapp_config",
        "verify_token": verify_token,
        "phone_number_id": phone_number_id,
        "auto_reply_enabled": auto_reply_enabled,
        "updatedAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }
    # Only update token if provided (so admin doesn't wipe existing token on other edits)
    if token:
        doc["token"] = token
    else:
        existing = whatsapp_config_col.find_one({"id": "whatsapp_config"})
        if existing and existing.get("token"):
            doc["token"] = existing["token"]

    whatsapp_config_col.update_one({"id": "whatsapp_config"}, {"$set": doc}, upsert=True)
    return jsonify({"success": True, "message": "WhatsApp configuration updated successfully."})


@app.route('/api/admin/whatsapp/test-send', methods=['POST'])
def test_send_whatsapp():
    if not verify_token():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    to_phone = (data.get('to_phone') or "").strip()
    test_query = (data.get('query') or "HI").strip()

    if not to_phone:
        return jsonify({"success": False, "error": "Please provide a recipient phone number."}), 400

    # Generate message through automation engine
    automated_message = build_whatsapp_automated_response(test_query, sender_name="Admin Test")

    # Attempt sending via Meta Cloud API
    res = send_whatsapp_message(to_phone, automated_message)

    # Log the test attempt
    try:
        whatsapp_logs_col.insert_one({
            "from": to_phone,
            "sender_name": "Admin Tester",
            "incoming_message": f"[TEST SIMULATION] {test_query}",
            "reply_message": automated_message,
            "dispatch_status": "SENT" if res.get("success") else "FAILED",
            "dispatch_error": res.get("error"),
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "epoch": int(datetime.utcnow().timestamp())
        })
    except Exception:
        pass

    return jsonify({
        "success": res.get("success", False),
        "message_preview": automated_message,
        "dispatch_result": res
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port, debug=False)
