
// Smart API Base URL logic for both local testing and production
let API_BASE = 'http://127.0.0.1:5005/api';
if (window.location.hostname.includes('render.com')) {
    API_BASE = '/api';
}
// Global In-Memory DB (Loaded synchronously on page load from MongoDB)
window.IGYR_DB = {
    institutes: [],
    results: [],
    notices: [],
    quicklinks: [],
    schemes: [],
    applications: [],
    settings: {
        supportEmail: "support@igyr.org",
        helplinePhone: "+91 1800-889-4497",
        supportHours: "Monday - Saturday: 9:00 AM - 6:00 PM IST",
        officeAddress: "IGYR National Education Secretariat, Central IT Complex, New Delhi - 110001, India",
        helpCenterUrl: "about.html#contact",
        whatsappSupport: "+91 98765 43210",
        contactHeading: "Support & Contact",
        contactSubtext: "Official 24/7 Educational Grievance & Technical Assistance Helpline"
    }
};

// 1. Synchronous fetch on initialization to ensure data is ready before admin.js/public.js runs
function initStorage() {
    try {
        const xhr = new XMLHttpRequest();
        // Use synchronous request (async: false) so the page blocks until data is ready.
        // This preserves the exact architecture of localStorage without breaking the 70+ existing function calls.
        xhr.open('GET', API_BASE + '/sync', false); 
        xhr.send(null);
        
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            window.IGYR_DB.institutes = data.institutes || [];
            window.IGYR_DB.results = data.results || [];
            window.IGYR_DB.notices = data.notices || [];
            window.IGYR_DB.quicklinks = data.quicklinks || [];
            window.IGYR_DB.schemes = data.schemes || [];
            window.IGYR_DB.applications = data.applications || [];
            if (data.settings) window.IGYR_DB.settings = data.settings;
        } else {
            console.error("Failed to sync from MongoDB:", xhr.status);
        }
    } catch(err) {
        console.error("Error communicating with Python Backend:", err);
    }
}

// Call immediately when script loads
initStorage();

// 2. Data Getters (Instantly return from memory)
function getInstitutes() { return window.IGYR_DB.institutes; }
function getResults() { return window.IGYR_DB.results; }
function getNotices() { return window.IGYR_DB.notices; }
function getQuickLinks() { return window.IGYR_DB.quicklinks; }
function getSchemes() { return window.IGYR_DB.schemes || []; }
function getApplications() { return window.IGYR_DB.applications || []; }
function getSystemSettings() {
    return window.IGYR_DB.settings || {
        supportEmail: "support@igyr.org",
        helplinePhone: "+91 1800-889-4497",
        supportHours: "Monday - Saturday: 9:00 AM - 6:00 PM IST",
        officeAddress: "IGYR National Education Secretariat, Central IT Complex, New Delhi - 110001, India",
        helpCenterUrl: "about.html#contact",
        whatsappSupport: "+91 98765 43210",
        contactHeading: "Support & Contact",
        contactSubtext: "Official 24/7 Educational Grievance & Technical Assistance Helpline"
    };
}

// 3. Data Setters (Update memory immediately, and async POST to Python Backend)

function getAuthHeaders() {
    const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('inst_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
    };
}

function saveInstitutes(institutes) { 
    window.IGYR_DB.institutes = institutes;
    return fetch(API_BASE + '/institutes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(institutes)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }).catch(e => { 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    });
}

function saveResults(results) { 
    window.IGYR_DB.results = results;
    return fetch(API_BASE + '/results', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(results)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }).catch(e => { 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    });
}

function saveNotices(notices) { 
    window.IGYR_DB.notices = notices;
    return fetch(API_BASE + '/notices', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notices)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }).catch(e => { 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    });
}


function submitSchemeApplication(appData) {
    return fetch(API_BASE + '/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected application: " + res.statusText);
        return res.json();
    });
}

function saveApplications(applications) {
    window.IGYR_DB.applications = applications;
    return fetch(API_BASE + '/applications/save-all', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(applications)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }).catch(e => { 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    });
}

function saveSchemes(schemes) { 
    window.IGYR_DB.schemes = schemes;
    return fetch(API_BASE + '/schemes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(schemes)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }).catch(e => { 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    });
}

function saveQuickLinks(links) { 
    window.IGYR_DB.quicklinks = links;
    return fetch(API_BASE + '/quicklinks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(links)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }).catch(e => { 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    });
}

function saveSystemSettings(settings) {
    window.IGYR_DB.settings = settings;
    return fetch(API_BASE + '/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
    }).then(res => {
        if (!res.ok) throw new Error("Server rejected save: " + res.statusText);
        return res.json();
    }).catch(e => { 
        console.error("DB Save Error:", e); 
        alert("Security Error: Please log out and log back in to refresh your security token!"); 
    });
}


// -----------------------------------------------------------
// REAL-TIME POLLING ENGINE (Updates without refresh)
// -----------------------------------------------------------
setInterval(() => {
    fetch(API_BASE + '/sync')
        .then(res => res.json())
        .then(data => {
            // Compare stringified versions to detect any changes
            const currentHash = JSON.stringify({
                institutes: window.IGYR_DB.institutes,
                results: window.IGYR_DB.results,
                notices: window.IGYR_DB.notices,
                quicklinks: window.IGYR_DB.quicklinks,
                schemes: window.IGYR_DB.schemes,
                applications: window.IGYR_DB.applications,
                settings: window.IGYR_DB.settings
            });
            
            const newHash = JSON.stringify({
                institutes: data.institutes || [],
                results: data.results || [],
                notices: data.notices || [],
                quicklinks: data.quicklinks || [],
                schemes: data.schemes || [],
                applications: data.applications || [],
                settings: data.settings || window.IGYR_DB.settings
            });
            
            if (currentHash !== newHash) {
                console.log("Real-time update detected from another device!");
                window.IGYR_DB.institutes = data.institutes || [];
                window.IGYR_DB.results = data.results || [];
                window.IGYR_DB.notices = data.notices || [];
                window.IGYR_DB.quicklinks = data.quicklinks || [];
                window.IGYR_DB.schemes = data.schemes || [];
                window.IGYR_DB.applications = data.applications || [];
                if (data.settings) window.IGYR_DB.settings = data.settings;
                
                // Fire custom event so pages can re-render automatically
                window.dispatchEvent(new Event('igyr_data_updated'));
            }
        })
        .catch(e => { /* Silently ignore network errors during polling */ });
}, 2000); // Poll every 2 seconds


// =========================================================================
// --- IGYR BRANDED CUSTOM ALERT & NOTIFICATION SYSTEM (NO "localhost says") ---
// =========================================================================
(function() {
    // Inject custom alert styles
    const style = document.createElement('style');
    style.innerHTML = `
        .igyr-alert-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(7, 29, 73, 0.65);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            padding: 20px;
            box-sizing: border-box;
        }
        .igyr-alert-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        .igyr-alert-card {
            background: #ffffff;
            border-radius: 20px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 25px 60px rgba(7, 29, 73, 0.28);
            border: 1px solid rgba(255, 255, 255, 0.8);
            overflow: hidden;
            transform: scale(0.9) translateY(15px);
            transition: transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: 'Inter', -apple-system, sans-serif;
            text-align: center;
        }
        .igyr-alert-overlay.active .igyr-alert-card {
            transform: scale(1) translateY(0);
        }
        .igyr-alert-header {
            background: linear-gradient(135deg, #071d49 0%, #0b3d8c 100%);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: #ffffff;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }
        .igyr-alert-header img {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 1.5px solid #ffffff;
            object-fit: cover;
        }
        .igyr-alert-header span {
            font-family: 'Poppins', sans-serif;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #fce38a;
        }
        .igyr-alert-body {
            padding: 26px 24px 20px;
            color: #1e293b;
            font-size: 15px;
            line-height: 1.65;
            max-height: 60vh;
            overflow-y: auto;
            word-wrap: break-word;
            text-align: left;
        }
        .igyr-alert-footer {
            padding: 0 24px 24px;
            display: flex;
            justify-content: center;
            gap: 12px;
        }
        .igyr-alert-btn {
            background: linear-gradient(135deg, #1266d6 0%, #0a3d8c 100%);
            color: #ffffff !important;
            border: none;
            padding: 12px 32px;
            border-radius: 10px;
            font-size: 14.5px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(18, 102, 214, 0.35);
            transition: all 0.2s ease;
            outline: none;
            min-width: 110px;
        }
        .igyr-alert-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(18, 102, 214, 0.45);
        }
        .igyr-alert-btn-cancel {
            background: #f1f5f9;
            color: #475569 !important;
            border: 1.5px solid #cbd5e1;
            box-shadow: none;
        }
        .igyr-alert-btn-cancel:hover {
            background: #e2e8f0;
            box-shadow: none;
            transform: none;
        }
    `;
    document.head.appendChild(style);

    function getOrCreateAlertElements() {
        let overlay = document.getElementById('igyr-custom-alert-overlay');
        if (!overlay) {
            if (!document.body) return null;
            overlay = document.createElement('div');
            overlay.id = 'igyr-custom-alert-overlay';
            overlay.className = 'igyr-alert-overlay';
            overlay.innerHTML = `
                <div class="igyr-alert-card" role="dialog" aria-modal="true">
                    <div class="igyr-alert-header">
                        <img src="igyr-logo.jpg" alt="IGYR" onerror="this.style.display='none'">
                        <span>IGYR Official Portal</span>
                    </div>
                    <div class="igyr-alert-body" id="igyr-alert-text"></div>
                    <div class="igyr-alert-footer" id="igyr-alert-actions">
                        <button type="button" class="igyr-alert-btn" id="igyr-alert-ok-btn">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    // Replace native window.alert (Removes "localhost says")
    window.alert = function(message) {
        return new Promise((resolve) => {
            const showDialog = () => {
                const overlay = getOrCreateAlertElements();
                if (!overlay) {
                    setTimeout(showDialog, 50);
                    return;
                }
                const textEl = document.getElementById('igyr-alert-text');
                const actionsEl = document.getElementById('igyr-alert-actions');

                let formatted = String(message)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\\n/g, '<br>')
                    .replace(/\n/g, '<br>');

                textEl.innerHTML = formatted;
                actionsEl.innerHTML = '<button type="button" class="igyr-alert-btn" id="igyr-alert-ok-btn">OK</button>';

                overlay.classList.add('active');

                const newOkBtn = document.getElementById('igyr-alert-ok-btn');
                if (newOkBtn) newOkBtn.focus();

                function closeAlert() {
                    overlay.classList.remove('active');
                    document.removeEventListener('keydown', keyHandler);
                    resolve();
                }

                function keyHandler(e) {
                    if (e.key === 'Enter' || e.key === 'Escape') closeAlert();
                }

                if (newOkBtn) newOkBtn.onclick = closeAlert;
                document.addEventListener('keydown', keyHandler);
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', showDialog);
            } else {
                showDialog();
            }
        });
    };

    // Custom confirm dialog (Replaces "localhost says" on confirmations)
    window.igyrConfirm = function(message, onConfirm, onCancel) {
        const showConfirm = () => {
            const overlay = getOrCreateAlertElements();
            if (!overlay) {
                setTimeout(showConfirm, 50);
                return;
            }
            const textEl = document.getElementById('igyr-alert-text');
            const actionsEl = document.getElementById('igyr-alert-actions');

            let formatted = String(message)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\\n/g, '<br>')
                .replace(/\n/g, '<br>');

            textEl.innerHTML = formatted;
            actionsEl.innerHTML = `
                <button type="button" class="igyr-alert-btn igyr-alert-btn-cancel" id="igyr-confirm-cancel">Cancel</button>
                <button type="button" class="igyr-alert-btn" id="igyr-confirm-ok">Confirm</button>
            `;

            overlay.classList.add('active');

            document.getElementById('igyr-confirm-ok').onclick = function() {
                overlay.classList.remove('active');
                if (onConfirm) onConfirm();
            };

            document.getElementById('igyr-confirm-cancel').onclick = function() {
                overlay.classList.remove('active');
                if (onCancel) onCancel();
            };
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showConfirm);
        } else {
            showConfirm();
        }
    };
})();
