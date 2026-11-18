# -*- coding: utf-8 -*-
"""
IGYR Main Platform - Maintenance & Security Guard
Listens to MongoDB 'soc_control' collection managed by the separate SOC server.
When the SOC switches the website OFF:
- Shows the official Under Maintenance page (maintenance.html)
- Main website does NOT host or reveal any SOC admin dashboard or SOC login
"""

import os
import time
import re
from datetime import datetime
from flask import request, jsonify, send_from_directory, make_response

# Threat patterns for security filtering
MALICIOUS_PATTERNS = [
    re.compile(r"(\bunion\b.*\bselect\b|'\s*or\s*'?1'?\s*=\s*'?1|\bdrop\b\s+\btable\b)", re.I),
    re.compile(r"(\$gt|\$ne|\$where|\$regex)", re.I),
    re.compile(r"(<script.*?>|javascript:|document\.cookie)", re.I),
    re.compile(r"(\.\./|\.\.\\|/etc/passwd|win\.ini)", re.I),
    re.compile(r"(\.env|\.git/|wp-login|phpmyadmin|cgi-bin|shell\.php)", re.I)
]

class MaintenanceState:
    def __init__(self):
        self.website_active = True
        self.maintenance_title = "Scheduled Platform Maintenance"
        self.maintenance_message = "India Get Your Result (IGYR) is undergoing scheduled system updates and security enhancements. Normal operations will resume shortly."
        self.estimated_restoration = "In progress"
        self.last_check = 0
        self.banned_ips = set()
        self.soc_control_col = None
        self.soc_logs_col = None
        self.soc_firewall_col = None

guard_state = MaintenanceState()

def get_ip():
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.headers.get('CF-Connecting-IP', request.remote_addr or '127.0.0.1')

def init_maintenance_guard(app, db):
    """Initializes the lightweight maintenance guard listener using MongoDB."""
    if db is not None:
        guard_state.soc_control_col = db['soc_control']
        guard_state.soc_logs_col = db['soc_security_logs']
        guard_state.soc_firewall_col = db['soc_ip_firewall']

    def refresh_state_from_db():
        now = time.time()
        if now - guard_state.last_check < 4:  # Cache for 4 seconds
            return
        guard_state.last_check = now

        if guard_state.soc_control_col is not None:
            try:
                doc = guard_state.soc_control_col.find_one({"id": "system_state"})
                if doc:
                    guard_state.website_active = bool(doc.get("website_active", True))
                    guard_state.maintenance_title = doc.get("maintenance_title", guard_state.maintenance_title)
                    guard_state.maintenance_message = doc.get("maintenance_message", guard_state.maintenance_message)
                    guard_state.estimated_restoration = doc.get("estimated_restoration", guard_state.estimated_restoration)

                # Sync banned IPs
                if guard_state.soc_firewall_col is not None:
                    docs = list(guard_state.soc_firewall_col.find({}, {"ip": 1}))
                    guard_state.banned_ips = {d["ip"] for d in docs if d.get("ip")}
            except Exception:
                pass

    @app.before_request
    def intercept_maintenance():
        path = request.path

        # Always exempt static assets, health probes, and the maintenance page itself
        if (path in ('/health', '/maintenance.html', '/favicon.ico', '/favicon.png',
                     '/favicon-48x48.png', '/favicon-96x96.png', '/favicon-192x192.png',
                     '/favicon-512x512.png', '/apple-touch-icon.png', '/site.webmanifest',
                     '/sw.js', '/firebase-messaging-sw.js') or
            path.startswith('/css/') or
            path.startswith('/js/') or
            path.startswith('/assets/')):
            return None

        # 1. Check IP Quarantine Firewall (set by SOC server)
        client_ip = get_ip()
        if client_ip in guard_state.banned_ips:
            return jsonify({
                "error": "ACCESS_DENIED",
                "message": "Access from your IP address is restricted by the Security Operations Centre."
            }), 403

        # 2. Check Malicious Cyber Threats (reported to SOC)
        query = request.query_string.decode('utf-8', errors='ignore')
        inspect_str = f"{path} {query}"
        for pattern in MALICIOUS_PATTERNS:
            if pattern.search(inspect_str):
                # Log incident to SOC MongoDB
                if guard_state.soc_logs_col is not None:
                    try:
                        guard_state.soc_logs_col.insert_one({
                            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                            "epoch": int(time.time()),
                            "ip": client_ip,
                            "threat_type": "MALICIOUS_PROBE",
                            "severity": "HIGH",
                            "details": f"Blocked probe on {path}",
                            "path": path,
                            "method": request.method,
                            "user_agent": request.headers.get('User-Agent', '')[:100],
                            "blocked": True
                        })
                    except Exception:
                        pass
                return jsonify({"error": "MALICIOUS_REQUEST_BLOCKED"}), 403

        # 3. Check Website Master ON/OFF Status (managed by SOC server)
        refresh_state_from_db()

        if not guard_state.website_active:
            # If API request, return JSON
            if path.startswith('/api/'):
                if path.startswith('/api/auth/admin'):
                    return None
                return jsonify({
                    "status": "maintenance",
                    "code": 503,
                    "title": guard_state.maintenance_title,
                    "message": guard_state.maintenance_message,
                    "estimated_restoration": guard_state.estimated_restoration
                }), 503

            # For browser visitors, serve maintenance.html
            base_dir = os.path.dirname(os.path.abspath(__file__))
            candidates = [base_dir, '.', os.path.join(base_dir, 'india-get-your-result')]
            for folder in candidates:
                if os.path.isfile(os.path.join(folder, 'maintenance.html')):
                    resp = make_response(send_from_directory(folder, 'maintenance.html'))
                    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                    resp.headers['Retry-After'] = '120'
                    return resp

            return make_response(f"<h1>{guard_state.maintenance_title}</h1><p>{guard_state.maintenance_message}</p>", 503)

        return None

    # Status check route used by maintenance.html auto-reconnection loop
    @app.route('/soc/api/status', methods=['GET'])
    @app.route('/api/status/maintenance', methods=['GET'])
    def public_maintenance_status():
        refresh_state_from_db()
        return jsonify({
            "website_active": guard_state.website_active,
            "maintenance_title": guard_state.maintenance_title,
            "maintenance_message": guard_state.maintenance_message,
            "estimated_restoration": guard_state.estimated_restoration
        })

    print("🛡️ Maintenance & Security Guard active on main platform.")
