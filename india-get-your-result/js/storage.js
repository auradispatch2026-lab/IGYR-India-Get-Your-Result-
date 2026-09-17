
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
    quicklinks: []
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

// 3. Data Setters (Update memory immediately, and async POST to Python Backend)
function saveInstitutes(institutes) { 
    window.IGYR_DB.institutes = institutes;
    return fetch(API_BASE + '/institutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(institutes)
    }).catch(e => { console.error("DB Save Error:", e); alert("Error saving to database: " + e.message); });
}

function saveResults(results) { 
    window.IGYR_DB.results = results;
    return fetch(API_BASE + '/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results)
    }).catch(e => { console.error("DB Save Error:", e); alert("Error saving to database: " + e.message); });
}

function saveNotices(notices) { 
    window.IGYR_DB.notices = notices;
    return fetch(API_BASE + '/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notices)
    }).catch(e => { console.error("DB Save Error:", e); alert("Error saving to database: " + e.message); });
}

function saveQuickLinks(links) { 
    window.IGYR_DB.quicklinks = links;
    return fetch(API_BASE + '/quicklinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links)
    }).catch(e => { console.error("DB Save Error:", e); alert("Error saving to database: " + e.message); });
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
                quicklinks: window.IGYR_DB.quicklinks
            });
            
            const newHash = JSON.stringify({
                institutes: data.institutes || [],
                results: data.results || [],
                notices: data.notices || [],
                quicklinks: data.quicklinks || []
            });
            
            if (currentHash !== newHash) {
                console.log("Real-time update detected from another device!");
                window.IGYR_DB.institutes = data.institutes || [];
                window.IGYR_DB.results = data.results || [];
                window.IGYR_DB.notices = data.notices || [];
                window.IGYR_DB.quicklinks = data.quicklinks || [];
                
                // Fire custom event so pages can re-render automatically
                window.dispatchEvent(new Event('igyr_data_updated'));
            }
        })
        .catch(e => { /* Silently ignore network errors during polling */ });
}, 2000); // Poll every 3 seconds
