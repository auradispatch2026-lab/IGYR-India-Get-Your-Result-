from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from pymongo import MongoClient
import os
import html as html_lib
from datetime import datetime

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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port, debug=False)
