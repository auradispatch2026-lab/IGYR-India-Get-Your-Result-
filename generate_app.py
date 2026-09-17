import os

base_dir = "india-get-your-result"
dirs = [
    "",
    "css",
    "js",
    "assets",
    "assets/logo",
    "assets/images"
]

for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

files = {}

files["index.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>India Get Your Result</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/public.css">
</head>
<body>
    <nav class="navbar">
        <div class="logo">IG INDIA GET YOUR RESULT</div>
        <ul class="nav-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="search-result.html">Search Result</a></li>
            <li><a href="verify-result.html">Verify Result</a></li>
            <li><a href="institute-login.html" class="btn btn-outline">Institute Login</a></li>
            <li><a href="admin-login.html" class="btn btn-primary">Admin Login</a></li>
        </ul>
    </nav>
    <header class="hero">
        <div class="hero-content">
            <h1>CHECK YOUR RESULT ONLINE</h1>
            <p>Access your school, college and coaching institute results quickly and securely.</p>
            <div class="search-card">
                <form id="quick-search-form">
                    <input type="text" id="reg-no" placeholder="Registration Number" required>
                    <input type="text" id="roll-no" placeholder="Roll Number" required>
                    <select id="institute-select" required><option value="">Select Institute</option></select>
                    <button type="submit" class="btn btn-primary">SEARCH RESULT</button>
                </form>
            </div>
        </div>
    </header>
    <section class="stats">
        <div class="stat-item"><h3>10+</h3><p>Institutes</p></div>
        <div class="stat-item"><h3>25,000+</h3><p>Students</p></div>
        <div class="stat-item"><h3>50+</h3><p>Results Published</p></div>
    </section>
    <script src="js/storage.js"></script>
    <script src="js/public.js"></script>
</body>
</html>"""

files["search-result.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Result - IGYR</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/public.css">
</head>
<body>
    <nav class="navbar">
        <div class="logo">IG INDIA GET YOUR RESULT</div>
        <ul class="nav-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="search-result.html">Search Result</a></li>
        </ul>
    </nav>
    <div class="container search-page">
        <h2>Search Your Result</h2>
        <form id="full-search-form" class="search-card">
            <input type="text" id="reg-no" placeholder="Registration Number" required>
            <input type="text" id="roll-no" placeholder="Roll Number" required>
            <select id="institute-select" required><option value="">Select Institute</option></select>
            <button type="submit" class="btn btn-primary">SEARCH RESULT</button>
        </form>
        <div id="error-msg" class="error" style="display:none;"></div>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/public.js"></script>
</body>
</html>"""

files["result.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Result</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/public.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <div class="container result-sheet" id="result-sheet">
        <div class="result-header">
            <h1 id="res-inst-name">Institute Name</h1>
            <h2 id="res-exam-name">Exam Name</h2>
        </div>
        <div class="student-info">
            <p><strong>Name:</strong> <span id="res-name"></span></p>
            <p><strong>Reg No:</strong> <span id="res-reg"></span></p>
            <p><strong>Roll No:</strong> <span id="res-roll"></span></p>
        </div>
        <table class="marks-table">
            <thead>
                <tr><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>Grade</th></tr>
            </thead>
            <tbody id="res-marks-body"></tbody>
        </table>
        <div class="result-summary">
            <p><strong>Total:</strong> <span id="res-total"></span></p>
            <p><strong>Percentage:</strong> <span id="res-perc"></span>%</p>
            <p><strong>Status:</strong> <span id="res-status"></span></p>
            <p><strong>Verification ID:</strong> <span id="res-vid"></span></p>
        </div>
        <div class="actions no-print">
            <button class="btn btn-primary" onclick="window.print()">PRINT RESULT</button>
            <button class="btn btn-outline" id="btn-download">DOWNLOAD PDF</button>
            <a href="verify-result.html" class="btn btn-outline">VERIFY RESULT</a>
        </div>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/result.js"></script>
</body>
</html>"""

files["verify-result.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verify Result</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/public.css">
</head>
<body>
    <div class="container verify-page">
        <h2>Verify Result</h2>
        <input type="text" id="verify-id" placeholder="Enter Verification ID">
        <button id="btn-verify" class="btn btn-primary">VERIFY</button>
        <div id="verify-output" style="margin-top:20px;"></div>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/public.js"></script>
</body>
</html>"""

files["institute-login.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Institute Login</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body class="bg-light">
    <div class="login-card">
        <h2>Institute Login</h2>
        <form id="inst-login-form">
            <input type="text" id="inst-id" placeholder="Institute ID (e.g. IGYR001)" required>
            <input type="password" id="inst-pass" placeholder="Password (demo123)" required>
            <button type="submit" class="btn btn-primary">LOGIN</button>
        </form>
        <p><a href="institute-register.html">Register Institute</a></p>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/institute.js"></script>
</body>
</html>"""

files["institute-register.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Institute Register</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-light">
    <div class="container">
        <h2>Register Institute</h2>
        <form id="inst-reg-form">
            <input type="text" id="reg-name" placeholder="Institute Name" required>
            <input type="text" id="reg-type" placeholder="Institute Type" required>
            <button type="submit" class="btn btn-primary">REGISTER</button>
        </form>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/institute.js"></script>
</body>
</html>"""

files["institute-dashboard.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Institute Dashboard</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard">
        <aside class="sidebar">
            <h2>IGYR Panel</h2>
            <ul>
                <li><a href="institute-dashboard.html">Dashboard</a></li>
                <li><a href="institute-upload-result.html">Upload Result</a></li>
                <li><a href="index.html" id="logout-btn">Logout</a></li>
            </ul>
        </aside>
        <main class="main-content">
            <h1>Dashboard</h1>
            <div class="cards">
                <div class="card"><h3>Total Students</h3><p>1,250</p></div>
                <div class="card"><h3>Published Results</h3><p>5</p></div>
            </div>
            <div class="chart-container"><canvas id="dashChart"></canvas></div>
        </main>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/institute.js"></script>
</body>
</html>"""

files["institute-upload-result.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Upload Result</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
    <div class="dashboard">
        <aside class="sidebar">
            <h2>IGYR Panel</h2>
            <ul>
                <li><a href="institute-dashboard.html">Dashboard</a></li>
                <li><a href="institute-upload-result.html">Upload Result</a></li>
                <li><a href="index.html">Logout</a></li>
            </ul>
        </aside>
        <main class="main-content">
            <h1>Upload Excel Result</h1>
            <input type="file" id="excel-file" accept=".xlsx, .xls">
            <button id="btn-process" class="btn btn-primary">Process</button>
            <div id="preview-area"></div>
            <button id="btn-publish" class="btn btn-primary" style="display:none; margin-top:20px;">Publish Result</button>
        </main>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/excel.js"></script>
</body>
</html>"""

files["admin-login.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body class="bg-light">
    <div class="login-card">
        <h2>Super Admin Login</h2>
        <form id="admin-login-form">
            <input type="text" id="admin-user" placeholder="Username (admin)" required>
            <input type="password" id="admin-pass" placeholder="Password (admin123)" required>
            <button type="submit" class="btn btn-primary">LOGIN</button>
        </form>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/admin.js"></script>
</body>
</html>"""

files["admin-dashboard.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>
    <div class="dashboard">
        <aside class="sidebar">
            <h2>Super Admin</h2>
            <ul>
                <li><a href="admin-dashboard.html">Dashboard</a></li>
                <li><a href="admin-institutes.html">Manage Institutes</a></li>
                <li><a href="index.html">Logout</a></li>
            </ul>
        </aside>
        <main class="main-content">
            <h1>Super Admin Dashboard</h1>
            <div class="cards">
                <div class="card"><h3>Total Institutes</h3><p id="tot-inst">0</p></div>
                <div class="card"><h3>Total Results</h3><p id="tot-res">0</p></div>
            </div>
        </main>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/admin.js"></script>
</body>
</html>"""

files["admin-institutes.html"] = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manage Institutes</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>
    <div class="dashboard">
        <aside class="sidebar">
            <h2>Super Admin</h2>
            <ul>
                <li><a href="admin-dashboard.html">Dashboard</a></li>
                <li><a href="admin-institutes.html">Manage Institutes</a></li>
                <li><a href="index.html">Logout</a></li>
            </ul>
        </aside>
        <main class="main-content">
            <h1>Manage Institutes</h1>
            <table class="table">
                <thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Action</th></tr></thead>
                <tbody id="admin-inst-body"></tbody>
            </table>
        </main>
    </div>
    <script src="js/storage.js"></script>
    <script src="js/admin.js"></script>
</body>
</html>"""

files["css/style.css"] = """
:root { --primary: #0a3d62; --accent: #e55039; --light: #f1f2f6; --text: #2f3640; }
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
body { background: #fff; color: var(--text); }
.bg-light { background: var(--light); }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-weight: bold; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-outline { background: transparent; border: 1px solid var(--primary); color: var(--primary); }
input, select { padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; width: 100%; }
.table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.table th, .table td { border: 1px solid #ccc; padding: 10px; text-align: left; }
"""

files["css/public.css"] = """
.navbar { display: flex; justify-content: space-between; padding: 20px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.nav-links { list-style: none; display: flex; gap: 15px; align-items: center; }
.nav-links a { text-decoration: none; color: var(--text); }
.hero { background: var(--primary); color: #fff; padding: 80px 20px; text-align: center; }
.search-card { background: #fff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 30px auto 0; color: var(--text); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.stats { display: flex; justify-content: space-around; padding: 50px 20px; background: var(--light); }
.result-sheet { border: 2px solid #ccc; padding: 40px; margin-top: 40px; max-width: 800px; }
.result-header { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
.marks-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
.marks-table th, .marks-table td { border: 1px solid #ccc; padding: 10px; text-align: center; }
@media print { .no-print { display: none; } }
"""

files["css/dashboard.css"] = """
.dashboard { display: flex; min-height: 100vh; }
.sidebar { width: 250px; background: var(--primary); color: #fff; padding: 20px; }
.sidebar ul { list-style: none; margin-top: 30px; }
.sidebar a { color: #fff; text-decoration: none; display: block; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
.main-content { flex: 1; padding: 30px; background: var(--light); }
.cards { display: flex; gap: 20px; margin-top: 20px; }
.card { background: #fff; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; }
.login-card { max-width: 400px; margin: 100px auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; }
.chart-container { background: #fff; padding: 20px; border-radius: 8px; margin-top: 30px; }
"""

files["js/storage.js"] = """
const DEMO_INSTITUTES = [
    { id: 'IGYR001', name: 'Odisha Public School', type: 'School', status: 'APPROVED' },
    { id: 'IGYR002', name: 'Delhi Modern College', type: 'College', status: 'APPROVED' }
];
const DEMO_RESULTS = [
    { reg: 'REG123', roll: 'ROL123', name: 'John Doe', instId: 'IGYR001', exam: 'Annual 2026', class: '10', marks: [{sub: 'Math', max: 100, obt: 85}, {sub: 'Science', max: 100, obt: 90}], vid: 'IGYR-2026-000123' }
];

function initStorage() {
    if (!localStorage.getItem('igyr_institutes')) {
        localStorage.setItem('igyr_institutes', JSON.stringify(DEMO_INSTITUTES));
    }
    if (!localStorage.getItem('igyr_results')) {
        localStorage.setItem('igyr_results', JSON.stringify(DEMO_RESULTS));
    }
}
initStorage();

function getInstitutes() { return JSON.parse(localStorage.getItem('igyr_institutes')) || []; }
function getResults() { return JSON.parse(localStorage.getItem('igyr_results')) || []; }
function saveResults(results) { localStorage.setItem('igyr_results', JSON.stringify(results)); }
function saveInstitutes(institutes) { localStorage.setItem('igyr_institutes', JSON.stringify(institutes)); }
"""

files["js/public.js"] = """
document.addEventListener('DOMContentLoaded', () => {
    const instSelects = document.querySelectorAll('#institute-select');
    const institutes = getInstitutes().filter(i => i.status === 'APPROVED');
    instSelects.forEach(select => {
        institutes.forEach(inst => {
            let opt = document.createElement('option');
            opt.value = inst.id;
            opt.textContent = inst.name;
            select.appendChild(opt);
        });
    });

    const searchForms = document.querySelectorAll('#quick-search-form, #full-search-form');
    searchForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const reg = form.querySelector('#reg-no').value;
            const roll = form.querySelector('#roll-no').value;
            const instId = form.querySelector('#institute-select').value;
            
            const results = getResults();
            const res = results.find(r => r.reg === reg && r.roll === roll && r.instId === instId);
            if (res) {
                sessionStorage.setItem('current_result', JSON.stringify(res));
                window.location.href = 'result.html';
            } else {
                alert('Result not found. Please check details.');
            }
        });
    });

    const verifyBtn = document.getElementById('btn-verify');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => {
            const vid = document.getElementById('verify-id').value;
            const results = getResults();
            const res = results.find(r => r.vid === vid);
            const out = document.getElementById('verify-output');
            if (res) {
                out.innerHTML = `<h3 style="color:green;">✓ RESULT VERIFIED</h3><p>${res.name} - ${res.exam}</p>`;
            } else {
                out.innerHTML = `<h3 style="color:red;">✕ RESULT NOT FOUND</h3>`;
            }
        });
    }
});
"""

files["js/result.js"] = """
document.addEventListener('DOMContentLoaded', () => {
    const res = JSON.parse(sessionStorage.getItem('current_result'));
    if (!res) {
        document.body.innerHTML = '<h2>No result selected.</h2><a href="index.html">Go Home</a>';
        return;
    }
    const inst = getInstitutes().find(i => i.id === res.instId);
    document.getElementById('res-inst-name').textContent = inst ? inst.name : 'Institute';
    document.getElementById('res-exam-name').textContent = res.exam;
    document.getElementById('res-name').textContent = res.name;
    document.getElementById('res-reg').textContent = res.reg;
    document.getElementById('res-roll').textContent = res.roll;
    
    let totalObt = 0;
    let totalMax = 0;
    const body = document.getElementById('res-marks-body');
    res.marks.forEach(m => {
        let tr = document.createElement('tr');
        let p = (m.obt / m.max) * 100;
        let grade = p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : 'F';
        tr.innerHTML = `<td>${m.sub}</td><td>${m.max}</td><td>${m.obt}</td><td>${grade}</td>`;
        body.appendChild(tr);
        totalObt += parseInt(m.obt);
        totalMax += parseInt(m.max);
    });
    let perc = ((totalObt / totalMax) * 100).toFixed(2);
    document.getElementById('res-total').textContent = `${totalObt} / ${totalMax}`;
    document.getElementById('res-perc').textContent = perc;
    document.getElementById('res-status').textContent = perc >= 40 ? 'PASS' : 'FAIL';
    document.getElementById('res-vid').textContent = res.vid;

    document.getElementById('btn-download').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`Result: ${res.name} - ${inst.name}`, 10, 10);
        doc.text(`Total: ${totalObt}/${totalMax} (${perc}%)`, 10, 20);
        doc.save(`${res.roll}_result.pdf`);
    });
});
"""

files["js/institute.js"] = """
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('inst-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('inst-id').value;
            const pass = document.getElementById('inst-pass').value;
            if (pass === 'demo123') {
                sessionStorage.setItem('inst_logged_in', id);
                window.location.href = 'institute-dashboard.html';
            } else {
                alert('Invalid password (use demo123)');
            }
        });
    }

    const regForm = document.getElementById('inst-reg-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const type = document.getElementById('reg-type').value;
            let insts = getInstitutes();
            let newId = 'IGYR' + Math.floor(Math.random()*10000);
            insts.push({id: newId, name, type, status: 'PENDING'});
            saveInstitutes(insts);
            alert(`Registered successfully. Your ID is ${newId}. Status: PENDING APPROVAL`);
            window.location.href = 'institute-login.html';
        });
    }

    const ctx = document.getElementById('dashChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                datasets: [{ label: 'Results Published', data: [2, 5, 1, 8], backgroundColor: '#e55039' }]
            }
        });
    }
});
"""

files["js/admin.js"] = """
document.addEventListener('DOMContentLoaded', () => {
    const adminLogin = document.getElementById('admin-login-form');
    if (adminLogin) {
        adminLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            if (document.getElementById('admin-user').value === 'admin' && document.getElementById('admin-pass').value === 'admin123') {
                window.location.href = 'admin-dashboard.html';
            } else {
                alert('Invalid credentials');
            }
        });
    }

    if (document.getElementById('tot-inst')) {
        document.getElementById('tot-inst').textContent = getInstitutes().length;
        document.getElementById('tot-res').textContent = getResults().length;
    }

    const instBody = document.getElementById('admin-inst-body');
    if (instBody) {
        const insts = getInstitutes();
        instBody.innerHTML = '';
        insts.forEach((inst, idx) => {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${inst.id}</td>
                <td>${inst.name}</td>
                <td>${inst.status}</td>
                <td><button onclick="approveInst(${idx})" class="btn btn-primary" ${inst.status==='APPROVED'?'disabled':''}>Approve</button></td>
            `;
            instBody.appendChild(tr);
        });
    }
});

function approveInst(idx) {
    let insts = getInstitutes();
    insts[idx].status = 'APPROVED';
    saveInstitutes(insts);
    location.reload();
}
"""

files["js/excel.js"] = """
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('excel-file');
    const processBtn = document.getElementById('btn-process');
    const publishBtn = document.getElementById('btn-publish');
    const previewArea = document.getElementById('preview-area');
    let parsedData = [];

    if (processBtn) {
        processBtn.addEventListener('click', () => {
            if (!fileInput.files.length) {
                alert('Select a file first.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
                
                if (jsonData.length < 2) return alert('Empty file');
                
                const headers = jsonData[0];
                parsedData = [];
                for(let i=1; i<jsonData.length; i++) {
                    if (jsonData[i].length) {
                        let obj = {};
                        headers.forEach((h, j) => obj[h] = jsonData[i][j]);
                        parsedData.push(obj);
                    }
                }
                
                let html = '<table class="table"><thead><tr>';
                headers.forEach(h => html += `<th>${h}</th>`);
                html += '</tr></thead><tbody>';
                parsedData.forEach(row => {
                    html += '<tr>';
                    headers.forEach(h => html += `<td>${row[h]}</td>`);
                    html += '</tr>';
                });
                html += '</tbody></table>';
                previewArea.innerHTML = html;
                publishBtn.style.display = 'block';
            };
            reader.readAsArrayBuffer(fileInput.files[0]);
        });
    }
    
    if (publishBtn) {
        publishBtn.addEventListener('click', () => {
            const instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
            const results = getResults();
            parsedData.forEach(row => {
                // simple mapping assumption
                let m = [];
                Object.keys(row).forEach(k => {
                    if (k !== 'Reg' && k !== 'Roll' && k !== 'Name') {
                        m.push({sub: k, max: 100, obt: row[k]});
                    }
                });
                results.push({
                    reg: row.Reg,
                    roll: row.Roll,
                    name: row.Name,
                    instId: instId,
                    exam: 'Uploaded Exam',
                    class: 'N/A',
                    marks: m,
                    vid: 'IGYR-' + Math.floor(Math.random()*1000000)
                });
            });
            saveResults(results);
            alert('Results published successfully!');
            window.location.href = 'institute-dashboard.html';
        });
    }
});
"""

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    with open(full_path, "w") as f:
        f.write(content)

print("Generated all files successfully in", base_dir)
