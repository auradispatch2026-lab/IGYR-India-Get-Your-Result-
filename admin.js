// SUPER ADMIN AUTHENTICATION CHECK
const securePages = ['admin-dashboard.html', 'admin-institutes.html', 'admin-login-institute.html'];
const currentPage = window.location.pathname.split('/').pop();

if (securePages.includes(currentPage)) {
    if (sessionStorage.getItem('superadmin') !== 'true') {
        alert("Access Denied! Please login first.");
        window.location.href = 'admin-login.html';
    }
}






window.handleGlobalNotice = function(e) {
    e.preventDefault();
    try {
        let text = document.getElementById('notice-text').value;
        let type = document.getElementById('notice-type').value;
        let notices = getNotices() || [];
        notices.push({
            text: text,
            type: type,
            date: new Date().toLocaleDateString()
        });
        saveNotices(notices);
        document.getElementById('global-notice-form').reset();
        
        // Re-render
        let noticeList = document.getElementById('notice-list');
        noticeList.innerHTML = '';
        notices.forEach((n, idx) => {
            let badge = n.type === 'urgent' ? '<span style="color:#e55039;font-weight:bold;">URGENT</span>' : n.type === 'warning' ? '<span style="color:#fbc531;font-weight:bold;">WARNING</span>' : '<span style="color:#062b63;font-weight:bold;">INFO</span>';
            noticeList.innerHTML += `<tr>
                <td style="white-space:nowrap;">${n.date}</td>
                <td>${badge}</td>
                <td>${n.text}</td>
                <td><button class="btn btn-outline" style="color:#e55039; border-color:#e55039; padding: 2px 8px;" onclick="deleteNotice(${idx})">Delete</button></td>
            </tr>`;
        });
        alert("Global Notice Published Successfully!");
    } catch(err) {
        alert("Error publishing notice: " + err.message);
        console.error(err);
    }
    return false;
};


document.addEventListener('DOMContentLoaded', () => {
    const adminLogin = document.getElementById('admin-login-form');
    if (adminLogin) {
        adminLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('admin-user').value;
            const p = document.getElementById('admin-pass').value;
            
            // SECURE SERVER-SIDE AUTHENTICATION
            fetch(API_BASE + '/auth/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    sessionStorage.setItem('superadmin', 'true');
                    sessionStorage.setItem('admin_token', data.token);
                    window.location.href = 'admin-dashboard.html';
                } else {
                    alert('Invalid credentials');
                }
            })
            .catch(err => {
                console.error(err);
                alert("Server connection failed!");
            });
        });
    }


    // --- DASHBOARD SPECIFIC LOGIC ---
    if (document.getElementById('tot-inst')) {
        document.getElementById('tot-inst').textContent = getInstitutes().length;
        document.getElementById('tot-res').textContent = getResults().length;
        
        // 1. Global Notice Logic
        const noticeForm = document.getElementById('global-notice-form');
        const noticeList = document.getElementById('notice-list');
        
        const renderNotices = () => {
            try {
                const notices = getNotices();
                noticeList.innerHTML = '';
                if(notices.length === 0) {
                    noticeList.innerHTML = '<tr><td colspan="4" style="text-align:center;">No notices published yet.</td></tr>';
                    return;
                }
                notices.forEach((n, idx) => {
                    let badge = n.type === 'urgent' ? '<span style="color:#e55039;font-weight:bold;">URGENT</span>' : n.type === 'warning' ? '<span style="color:#fbc531;font-weight:bold;">WARNING</span>' : '<span style="color:#062b63;font-weight:bold;">INFO</span>';
                    noticeList.innerHTML += `<tr>
                        <td style="white-space:nowrap;">${n.date}</td>
                        <td>${badge}</td>
                        <td>${n.text}</td>
                        <td><button class="btn btn-outline" style="color:#e55039; border-color:#e55039; padding: 2px 8px;" onclick="deleteNotice(${idx})">Delete</button></td>
                    </tr>`;
                });
            } catch(e) {
                console.error("Notice render error:", e);
            }
        };
        
        window.deleteNotice = (idx) => {
            let notices = getNotices();
            notices.splice(idx, 1);
            saveNotices(notices);
            renderNotices();
        };

        if (noticeForm) {
            renderNotices();

        }
        
        // 2. Geographical Breakdown
        const geoTbody = document.getElementById('geo-tbody');
        if (geoTbody) {
          try {
            let insts = getInstitutes() || [];
            let res = getResults() || [];
            
            if (insts.length === 0) {
                geoTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No institutes registered yet.</td></tr>';
            } else {
            
            // Build hierarchy: State -> District -> {instCount, resCount}
            let geo = {};
            insts.forEach(i => {
                let st = i.state || "Unknown State";
                let dt = i.district || "Unknown District";
                if (!geo[st]) geo[st] = { count: 0, resCount: 0, districts: {} };
                if (!geo[st].districts[dt]) geo[st].districts[dt] = { count: 0, resCount: 0 };
                
                geo[st].count++;
                geo[st].districts[dt].count++;
            });
            
            // Map results to their respective institutes to count them
            res.filter(r => r.status === 'PUBLISHED').forEach(r => {
                let i = insts.find(inst => inst.id === r.instId);
                if (i) {
                    let st = i.state || "Unknown State";
                    let dt = i.district || "Unknown District";
                    if (geo[st]) geo[st].resCount++;
                    if (geo[st] && geo[st].districts[dt]) geo[st].districts[dt].resCount++;
                }
            });
            
            // Render
            let html = "";
            Object.keys(geo).sort().forEach(state => {
                html += `<tr class="geo-state">
                    <td>▼ ${state}</td>
                    <td>${geo[state].count}</td>
                    <td>${geo[state].resCount}</td>
                </tr>`;
                
                Object.keys(geo[state].districts).sort().forEach(district => {
                    let d = geo[state].districts[district];
                    html += `<tr class="geo-district">
                        <td style="padding-left: 30px;">└ ${district}</td>
                        <td>${d.count}</td>
                        <td>${d.resCount}</td>
                    </tr>`;
                });
            });
            geoTbody.innerHTML = html;
            }
          } catch(e) {
            console.error("Geo Table error:", e);
          }
        }
        
        // 3. Upcoming Results Popup Logic
        const upcomingModal = document.getElementById('upcoming-modal');
        const upcomingList = document.getElementById('upcoming-list');
        
        if (upcomingModal && upcomingList) {
            let today = new Date().toISOString().split('T')[0];
            let allRes = getResults();
            let insts = getInstitutes();
            
            // Group by exam + instId
            let uniqueExams = {};
            allRes.forEach(r => {
                let key = r.instId + "|" + r.exam;
                if (!uniqueExams[key]) {
                    uniqueExams[key] = { date: r.date, instId: r.instId, exam: r.exam, count: 0, status: r.status };
                }
                uniqueExams[key].count++;
            });
            
            let upcomingHtml = "";
            let triggerPopup = false;
            
            Object.values(uniqueExams).forEach(u => {
                let instObj = insts.find(i => i.id === u.instId);
                // Only show if the institute still exists, and the exam is NOT already published
                if (u.date === today && instObj && u.status !== 'PUBLISHED') {
                    triggerPopup = true;
                    let iName = instObj.name;
                    upcomingHtml += `<div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ccc;">
                        <strong>Institution:</strong> ${iName}<br>
                        <strong>Examination:</strong> ${u.exam} <span style="font-size:11px; background:#fce38a; color:#062b63; padding: 2px 5px; border-radius:3px; font-weight: bold;">${u.status}</span><br>
                        <strong>Total Students:</strong> ${u.count}<br>
                        <strong>Action Needed:</strong> Result scheduled for today.
                    </div>`;
                }
            });
            
            if (triggerPopup) {
                upcomingList.innerHTML = upcomingHtml;
                upcomingModal.style.display = 'flex';
            }
        }
    }
    
    // --- QUICK LINKS LOGIC ---
    const qlForm = document.getElementById('quick-links-form');
    const qlList = document.getElementById('quick-links-list');
    
    window.editQuickLink = function(idx) {
        const links = getQuickLinks();
        const l = links[idx];
        if (!l) return;
        
        const editIdxInput = document.getElementById('ql-edit-index');
        const textInput = document.getElementById('ql-text');
        const urlInput = document.getElementById('ql-url');
        const submitBtn = document.getElementById('ql-submit-btn');
        const cancelBtn = document.getElementById('ql-cancel-btn');
        const titleEl = document.getElementById('ql-form-title');
        
        if (editIdxInput) editIdxInput.value = idx;
        if (textInput) textInput.value = l.text || '';
        if (urlInput) urlInput.value = l.url || '';
        if (submitBtn) {
            submitBtn.textContent = "💾 Update Link";
            submitBtn.style.background = "#28a745";
            submitBtn.style.borderColor = "#28a745";
        }
        if (cancelBtn) cancelBtn.style.display = "inline-block";
        if (titleEl) titleEl.textContent = "✏️ Edit Quick Link: " + (l.text || '');
        
        if (qlForm) qlForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (textInput) textInput.focus();
        renderQuickLinks();
    };

    window.cancelQuickLinkEdit = function() {
        const form = document.getElementById('quick-links-form');
        if (form) form.reset();
        
        const editIdxInput = document.getElementById('ql-edit-index');
        const submitBtn = document.getElementById('ql-submit-btn');
        const cancelBtn = document.getElementById('ql-cancel-btn');
        const titleEl = document.getElementById('ql-form-title');
        
        if (editIdxInput) editIdxInput.value = "-1";
        if (submitBtn) {
            submitBtn.textContent = "Add Link";
            submitBtn.style.background = "";
            submitBtn.style.borderColor = "";
        }
        if (cancelBtn) cancelBtn.style.display = "none";
        if (titleEl) titleEl.textContent = "🔗 Manage Quick Links (Footer)";
        renderQuickLinks();
    };

    window.deleteQuickLink = function(idx) {
        const doDelete = function() {
            let links = getQuickLinks();
            links.splice(idx, 1);
            saveQuickLinks(links);
            cancelQuickLinkEdit();
        };

        if (typeof window.igyrConfirm === 'function') {
            window.igyrConfirm("Are you sure you want to delete this Quick Link?", doDelete);
        } else {
            if (confirm("Are you sure you want to delete this Quick Link?")) {
                doDelete();
            }
        }
    };

    window.renderQuickLinks = function() {
        if(!qlList) return;
        try {
            const links = getQuickLinks();
            qlList.innerHTML = '';
            if(links.length === 0) {
                qlList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 15px; color: #888;">No quick links added yet.</td></tr>';
                return;
            }
            const activeEditIdx = parseInt(document.getElementById('ql-edit-index')?.value ?? '-1', 10);

            links.forEach((l, idx) => {
                const isEditing = idx === activeEditIdx;
                const rowBg = isEditing ? 'background: #eef6ff;' : '';
                const safeText = String(l.text || '').replace(/"/g, '&quot;');
                const safeUrl = String(l.url || '').replace(/"/g, '&quot;');
                
                qlList.innerHTML += `<tr style="${rowBg}">
                    <td style="font-weight: 600; vertical-align: middle;">
                        ${isEditing ? '<span style="color:#0d6efd; font-size:11px; margin-right:4px;">▶ EDITING:</span>' : ''}${safeText}
                    </td>
                    <td style="color: #4a5568; word-break: break-all; vertical-align: middle;">${safeUrl}</td>
                    <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
                        <button type="button" class="btn btn-outline" style="color: #0d6efd; border-color: #0d6efd; padding: 4px 10px; font-size: 12px; margin-right: 6px; cursor: pointer;" onclick="editQuickLink(${idx})">✏️ Edit</button>
                        <button type="button" class="btn btn-outline" style="color: #e55039; border-color: #e55039; padding: 4px 10px; font-size: 12px; cursor: pointer;" onclick="deleteQuickLink(${idx})">🗑️ Delete</button>
                    </td>
                </tr>`;
            });
        } catch(e) { console.error(e); }
    };
    
    if (qlForm) {
        renderQuickLinks();
        qlForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editIdx = parseInt(document.getElementById('ql-edit-index')?.value ?? '-1', 10);
            let links = getQuickLinks();
            const linkData = {
                text: document.getElementById('ql-text').value.trim(),
                url: document.getElementById('ql-url').value.trim()
            };

            if (editIdx >= 0 && editIdx < links.length) {
                links[editIdx] = linkData;
                alert("Quick Link updated successfully! It will now show up on the front page and footer.");
            } else {
                links.push(linkData);
                alert("Quick Link added successfully! It will now show up on the front page and footer.");
            }
            saveQuickLinks(links);
            cancelQuickLinkEdit();
        });
    }

    // --- DASHBOARD SUPPORT & CONTACT SETTINGS ---
    const dashSupportForm = document.getElementById('dash-support-form');
    if (dashSupportForm) {
        const loadDashSupport = () => {
            const settings = typeof getSystemSettings === 'function' ? getSystemSettings() : {};
            const emailInp = document.getElementById('dash-set-email');
            const phoneInp = document.getElementById('dash-set-phone');
            const hoursInp = document.getElementById('dash-set-hours');
            const waInp = document.getElementById('dash-set-whatsapp');

            if (emailInp) emailInp.value = settings.supportEmail || 'support@igyr.org';
            if (phoneInp) phoneInp.value = settings.helplinePhone || '+91 1800-889-4497';
            if (hoursInp) hoursInp.value = settings.supportHours || 'Monday - Saturday: 9:00 AM - 6:00 PM IST';
            if (waInp) waInp.value = settings.whatsappSupport || '+91 98765 43210';
        };

        loadDashSupport();

        window.handleDashSupportSave = function(e) {
            if (e) e.preventDefault();
            const currentSettings = typeof getSystemSettings === 'function' ? getSystemSettings() : {};
            const updated = {
                ...currentSettings,
                id: 'system_settings',
                supportEmail: document.getElementById('dash-set-email').value.trim(),
                helplinePhone: document.getElementById('dash-set-phone').value.trim(),
                supportHours: document.getElementById('dash-set-hours').value.trim(),
                whatsappSupport: document.getElementById('dash-set-whatsapp').value.trim()
            };

            saveSystemSettings(updated);
            const statusEl = document.getElementById('dash-support-status');
            if (statusEl) {
                statusEl.style.display = 'inline';
                setTimeout(() => { statusEl.style.display = 'none'; }, 3500);
            }
            alert("Support & Contact settings saved successfully! Changes are live on public footers.");
            return false;
        };
    }

    
    const autoNoticeList = document.getElementById('auto-notice-list');
    if (autoNoticeList) {
        window.renderAutoNotices = function() {
            autoNoticeList.innerHTML = '';
            const allResults = getResults();
            const insts = getInstitutes();
            
            const seen = new Set();
            const publishedExams = [];
            
            allResults.forEach(r => {
                if (r.status === 'PUBLISHED') {
                    let key = r.instId + '|||' + r.exam;
                    if (!seen.has(key)) {
                        seen.add(key);
                        let instName = "Unknown";
                        let instObj = insts.find(i => i.id === r.instId);
                        if (instObj) instName = instObj.name;
                        
                        publishedExams.push({
                            instId: r.instId,
                            instName: instName,
                            exam: r.exam
                        });
                    }
                }
            });
            
            if (publishedExams.length === 0) {
                autoNoticeList.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#777;">No automatic result notices currently published.</td></tr>';
            } else {
                publishedExams.forEach(pe => {
                    let tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${pe.instName} <br><small style="color:#888;">(${pe.instId})</small></td>
                        <td>${pe.exam}</td>
                        <td>
                            <button class="btn btn-outline" style="color: #e55039; border-color: #e55039; padding: 2px 10px; font-size: 0.8rem;" onclick="deleteAutoNotice('${pe.instId}', '${pe.exam}')">Delete Notice</button>
                        </td>
                    `;
                    autoNoticeList.appendChild(tr);
                });
            }
        };
        
        window.deleteAutoNotice = function(instId, examName) {
            if (confirm(`Are you sure you want to delete the notice for '${examName}'? (This will unpublish the result)`)) {
                let allResults = getResults();
                let updated = false;
                allResults.forEach(r => {
                    if (r.instId === instId && r.exam === examName) {
                        r.status = 'DRAFT'; // unpublish it to remove the notice
                        updated = true;
                    }
                });
                if (updated) {
                    saveResults(allResults);
                    renderAutoNotices();
                    
                    // Also trigger the geographical scan again since a result was unpublished
                    if(typeof window.renderGeoTable === 'function') window.renderGeoTable();
                    
                    alert("Automatic Result Notice deleted successfully!");
                }
            }
        };
        
        renderAutoNotices();
    }
    // Real-Time Update Listener
    window.addEventListener('igyr_data_updated', () => {
        console.log("Admin Dashboard Auto-updating...");
        if (typeof renderNotices === 'function') renderNotices();
        if (typeof window.renderQuickLinks === 'function') window.renderQuickLinks();
        if (typeof window.renderAutoNotices === 'function') window.renderAutoNotices();
        if (typeof window.renderGeoTable === 'function') window.renderGeoTable();
        if (typeof renderInstitutes === 'function') renderInstitutes();
        
        // Update stats
        const totInst = document.getElementById('tot-inst');
        const totRes = document.getElementById('tot-res');
        if (totInst) totInst.textContent = getInstitutes().length;
        if (totRes) totRes.textContent = getResults().length;
    });


// --- END DASHBOARD SPECIFIC LOGIC ---


    const instBody = document.getElementById('admin-inst-body');
    


    if (instBody) {
        renderInstitutes();
        
        const stateSel = document.getElementById('add-inst-state');
        const distSel = document.getElementById('add-inst-district');
        
        if (stateSel && typeof INDIA_STATES !== 'undefined') {
            Object.keys(INDIA_STATES).forEach(state => {
                let opt = document.createElement('option');
                opt.value = state;
                opt.textContent = state;
                stateSel.appendChild(opt);
            });
            
            stateSel.addEventListener('change', () => {
                distSel.innerHTML = '<option value="">Select District</option>';
                const dists = INDIA_STATES[stateSel.value] || [];
                dists.forEach(d => {
                    let opt = document.createElement('option');
                    opt.value = d;
                    opt.textContent = d;
                    distSel.appendChild(opt);
                });
            });
        }
        
        
        const pinInput = null;
        const cityInput = document.getElementById('add-inst-city');
        if (pinInput && cityInput) {
            pinInput.addEventListener('input', async (e) => {
                const pin = e.target.value;
                if (pin.length === 6) {
                    cityInput.value = "Fetching...";
                    try {
                        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
                        const data = await res.json();
                        if (data && data[0].Status === "Success") {
                            const po = data[0].PostOffice[0];
                            cityInput.value = po.Name + (po.Block && po.Block !== "NA" && po.Block !== po.Name ? ", " + po.Block : "");
                            cityInput.removeAttribute('readonly');
                        } else {
                            cityInput.value = "";
                            cityInput.placeholder = "Invalid PIN";
                            cityInput.removeAttribute('readonly');
                        }
                    } catch (err) {
                        cityInput.value = "";
                        cityInput.placeholder = "Enter City";
                        cityInput.removeAttribute('readonly');
                    }
                } else {
                    cityInput.value = "";
                    cityInput.setAttribute('readonly', true);
                    cityInput.placeholder = "City (Auto-fill)";
                }
            });
        }
        
        
        const addForm = document.getElementById('admin-add-inst-form');
        if (addForm) {
            addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('add-inst-name').value;
                const type = document.getElementById('add-inst-type').value;
                const state = stateSel.value;
                const dist = distSel.value;
                const addrInput = document.getElementById('add-inst-address');
                const address = addrInput ? addrInput.value.trim() : '';
                
                const customIdInput = document.getElementById('add-inst-id');
                let newId = customIdInput ? customIdInput.value.trim() : ('IGYR' + Math.floor(Math.random()*10000));
                
                const insts = getInstitutes();
                
                if(insts.some(i => i.id === newId)) {
                    alert("This Institute ID is already taken!");
                    return;
                }
                
                // Helper to read file as Base64
                const readFileAsBase64 = (fileInput) => {
                    return new Promise((resolve) => {
                        if (fileInput && fileInput.files && fileInput.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve(e.target.result);
                            reader.onerror = () => resolve(null);
                            reader.readAsDataURL(fileInput.files[0]);
                        } else {
                            resolve(null);
                        }
                    });
                };
                
                const logoInput = document.getElementById('add-inst-logo');
                const signInput = document.getElementById('add-inst-sign');
                
                const logoBase64 = await readFileAsBase64(logoInput);
                const signBase64 = await readFileAsBase64(signInput);
                
                insts.push({
                    id: newId,
                    name: name,
                    type: type,
                    state: state,
                    district: dist,
                    address: address,
                    status: 'APPROVED',
                    password: 'demo123',
                    logo: logoBase64,
                    signature: signBase64
                });
                
                saveInstitutes(insts);
                
                alert(`Institute Added Successfully!

Institute ID: ${newId}`);
                addForm.reset();
                if(distSel) distSel.innerHTML = '<option value="">Select District</option>';
                renderInstitutes();
            });
        }
    }
    
    const instLoginForm = document.getElementById('admin-inst-login-form');
    if (instLoginForm) {
        instLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const targetId = document.getElementById('target-inst-id').value.trim();
            const inst = getInstitutes().find(i => i.id === targetId);
            if (inst && inst.status === 'APPROVED') {
                loginAsInst(targetId);
            } else {
                alert('Invalid Institute ID or Institute is not approved.');
            }
        });
    }
});

function renderInstitutes() {
    const instBody = document.getElementById('admin-inst-body');
    if(!instBody) return;
    const insts = getInstitutes();
    instBody.innerHTML = '';
    insts.forEach((inst, idx) => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${inst.id}</td>
            <td>${inst.name}<br><small style="color:#777;">${inst.address ? inst.address+", " : ""}${inst.district || "N/A"}, ${inst.state || "N/A"}</small></td>
            <td>
                <button class="btn btn-outline btn-edit-inst" data-id="${inst.id}" style="color: #1266d6; border-color: #1266d6; padding: 5px 15px; font-size: 0.9rem; margin-right: 5px;">Edit Info</button>
                <button class="btn btn-outline btn-delete-inst" data-idx="${idx}" style="color: #e55039; border-color: #e55039; padding: 5px 15px; font-size: 0.9rem;">Delete</button>
            </td>
        `;
        instBody.appendChild(tr);
    });
    
    // Attach event listeners dynamically to bypass any inline onclick issues
    document.querySelectorAll('.btn-edit-inst').forEach(btn => {
        btn.addEventListener('click', function() {
            let id = this.getAttribute('data-id');
            if(typeof window.openEditModal === 'function') {
                window.openEditModal(id);
            } else {
                alert("openEditModal function is missing!");
            }
        });
    });
    
    document.querySelectorAll('.btn-delete-inst').forEach(btn => {
        btn.addEventListener('click', function() {
            let idx = this.getAttribute('data-idx');
            if(typeof window.deleteInst === 'function') {
                window.deleteInst(idx);
            }
        });
    });
}

function approveInst(idx) {
    let insts = getInstitutes();
    insts[idx].status = 'APPROVED';
    
    saveInstitutes(insts);
    renderInstitutes();
}

function loginAsInst(id) {
    sessionStorage.setItem('inst_logged_in', id);
    window.location.href = 'institute-dashboard.html';
}

function deleteInst(idx) {
    if (confirm("Are you sure you want to permanently delete this institute?")) {
        let insts = getInstitutes();
        insts.splice(idx, 1);
        saveInstitutes(insts);
        renderInstitutes();
    }
}


function editInstId(oldId) {
    const newId = prompt("Enter new Institute ID:", oldId);
    if (!newId || newId.trim() === "" || newId === oldId) return;
    
    let insts = getInstitutes();
    if(insts.some(i => i.id === newId.trim())) {
        alert("This Institute ID already exists!");
        return;
    }
    
    // Update Institute ID
    let inst = insts.find(i => i.id === oldId);
    if(inst) {
        inst.id = newId.trim();
        saveInstitutes(insts);
        
        // Also update all results associated with this ID!
        let results = getResults();
        let updated = false;
        results.forEach(r => {
            if(r.instId === oldId) {
                r.instId = newId.trim();
                updated = true;
            }
        });
        if(updated) saveResults(results);
        
        alert("Institute ID updated successfully to: " + newId.trim());
        renderInstitutes();
    }
}


/* openEditModal moved to inline */

document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-inst-form');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const origId = document.getElementById('edit-original-id').value;
            const newId = document.getElementById('edit-inst-id').value.trim();
            let insts = getInstitutes();
            
            if (newId !== origId && insts.some(i => i.id === newId)) {
                alert('This Institute ID is already taken by another institute.');
                return;
            }
            
            let instIndex = insts.findIndex(i => i.id === origId);
            if (instIndex > -1) {
                insts[instIndex].id = newId;
                insts[instIndex].name = document.getElementById('edit-inst-name').value.trim();
                insts[instIndex].type = document.getElementById('edit-inst-type').value.trim();
                insts[instIndex].state = document.getElementById('edit-inst-state').value;
                insts[instIndex].district = document.getElementById('edit-inst-district').value;
                insts[instIndex].address = document.getElementById('edit-inst-address').value.trim();
                
                saveInstitutes(insts);
                
                if (newId !== origId) {
                    let results = getResults();
                    let updated = false;
                    results.forEach(r => {
                        if (r.instId === origId) {
                            r.instId = newId;
                            updated = true;
                        }
                    });
                    if (updated) saveResults(results);
                }
                
                alert("Institute details updated successfully!");
                document.getElementById('edit-inst-modal').style.display = 'none';
                renderInstitutes();
            }
        });
    }

    // ==========================================
    // --- SCHEMES MANAGEMENT LOGIC (ADMIN) ---
    // ==========================================
    const schemeForm = document.getElementById('scheme-form');
    const schemeList = document.getElementById('scheme-list');
    
    window.renderSchemesList = function() {
        if (!schemeList) return;
        const schemes = getSchemes();
        schemeList.innerHTML = '';
        if (!schemes || schemes.length === 0) {
            schemeList.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 25px; color:#888;">No tabulation schemes added yet. Create your first scheme above!</td></tr>';
            return;
        }
        
        schemes.forEach((sch, idx) => {
            const tr = document.createElement('tr');
            const colorMap = {
                blue: '#1266d6',
                purple: '#8e44ad',
                green: '#27ae60',
                orange: '#e67e22',
                rose: '#e84393',
                teal: '#00cec9'
            };
            const themeColor = colorMap[sch.color] || '#1266d6';
            
            let featuresStr = '';
            if (Array.isArray(sch.features)) {
                featuresStr = sch.features.join(' • ');
            } else if (sch.features) {
                featuresStr = sch.features;
            }
            
            tr.innerHTML = `
                <td style="padding: 12px 10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${themeColor}; flex-shrink:0;"></span>
                        <strong style="color: #062b63; font-size: 14px;">${sch.name}</strong>
                    </div>
                    ${sch.badge ? `<span style="display:inline-block; margin-top:5px; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; background:${themeColor}15; color:${themeColor}; border:1px solid ${themeColor}40;">${sch.badge}</span>` : ''}
                </td>
                <td style="padding: 12px 10px;">
                    <div style="font-size: 24px; font-weight: 800; color: ${themeColor}; font-family: 'Poppins', sans-serif; line-height: 1.1;">
                        ₹${sch.rate}
                    </div>
                    <small style="color: #666; font-weight: 500;">${sch.unit || 'per student'}</small>
                </td>
                <td style="max-width: 280px; font-size: 12px; color: #555; padding: 12px 10px;">
                    <p style="margin:0 0 5px 0; font-weight:600; color:#1a202c;">${sch.desc || ''}</p>
                    ${featuresStr ? `<div style="color:#718096; font-size:11px; line-height:1.4;">${featuresStr}</div>` : ''}
                </td>
                <td style="padding: 12px 10px;">
                    <span style="text-transform: capitalize; font-weight: 700; color: ${themeColor}; font-size: 12px; background:${themeColor}12; padding:3px 8px; border-radius:4px;">
                        ${sch.color || 'blue'}
                    </span>
                </td>
                <td style="white-space:nowrap; padding: 12px 10px;">
                    <button class="btn btn-outline" style="color: #1266d6; border-color: #1266d6; padding: 4px 10px; font-size: 12px; margin-right: 6px;" onclick="editScheme(${idx})">✏️ Edit</button>
                    <button class="btn btn-outline" style="color: #e55039; border-color: #e55039; padding: 4px 10px; font-size: 12px;" onclick="deleteScheme(${idx})">🗑️ Delete</button>
                </td>
            `;
            schemeList.appendChild(tr);
        });
    };
    
    window.deleteScheme = function(idx) {
        igyrConfirm("Are you sure you want to delete this pricing scheme?", function() {
            let schemes = getSchemes();
            schemes.splice(idx, 1);
            saveSchemes(schemes);
            renderSchemesList();
        });
    };
    
    window.editScheme = function(idx) {
        let schemes = getSchemes();
        let sch = schemes[idx];
        if (!sch) return;
        
        document.getElementById('scheme-id-input').value = sch.id || ('SCH_' + idx);
        document.getElementById('scheme-index-input').value = idx;
        document.getElementById('scheme-name-input').value = sch.name || '';
        document.getElementById('scheme-rate-input').value = sch.rate || '';
        document.getElementById('scheme-unit-input').value = sch.unit || 'per student';
        document.getElementById('scheme-badge-input').value = sch.badge || '';
        document.getElementById('scheme-color-input').value = sch.color || 'blue';
        document.getElementById('scheme-desc-input').value = sch.desc || '';
        document.getElementById('scheme-features-input').value = Array.isArray(sch.features) ? sch.features.join('\n') : (sch.features || '');
        
        document.getElementById('scheme-submit-btn').textContent = "💾 Update Scheme";
        document.getElementById('scheme-cancel-btn').style.display = "inline-block";
        document.getElementById('scheme-form-title').textContent = "✏️ Edit Scheme: " + sch.name;
        
        document.getElementById('scheme-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    
    window.cancelSchemeEdit = function() {
        if (!document.getElementById('scheme-form')) return;
        document.getElementById('scheme-form').reset();
        document.getElementById('scheme-index-input').value = '-1';
        document.getElementById('scheme-id-input').value = '';
        document.getElementById('scheme-submit-btn').textContent = "➕ Save Scheme";
        document.getElementById('scheme-cancel-btn').style.display = "none";
        document.getElementById('scheme-form-title').textContent = "➕ Add New Tabulation Scheme";
    };
    
    if (schemeForm) {
        renderSchemesList();
        schemeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const editIdx = parseInt(document.getElementById('scheme-index-input').value, 10);
            let schemes = getSchemes();
            
            const featuresRaw = document.getElementById('scheme-features-input').value.trim();
            const featuresArray = featuresRaw ? featuresRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];
            
            const schemeObj = {
                id: document.getElementById('scheme-id-input').value || ('SCH_' + Date.now()),
                name: document.getElementById('scheme-name-input').value.trim(),
                rate: document.getElementById('scheme-rate-input').value.trim(),
                unit: document.getElementById('scheme-unit-input').value.trim() || 'per student',
                badge: document.getElementById('scheme-badge-input').value.trim(),
                color: document.getElementById('scheme-color-input').value,
                desc: document.getElementById('scheme-desc-input').value.trim(),
                features: featuresArray
            };
            
            if (editIdx >= 0 && editIdx < schemes.length) {
                schemes[editIdx] = schemeObj;
                alert("Scheme updated successfully! Changes are live on the website.");
            } else {
                schemes.push(schemeObj);
                alert("New tabulation scheme added successfully! It is now live on the website.");
            }
            
            saveSchemes(schemes);
            cancelSchemeEdit();
            renderSchemesList();
        });
    }


    // Update Submission Forms pending badge in sidebar
    window.updatePendingAppsBadge = function() {
        const apps = (typeof getApplications === 'function') ? getApplications() : [];
        const pendingCount = apps.filter(a => a.status === 'PENDING').length;
        const links = document.querySelectorAll('.sidebar ul li a');
        links.forEach(a => {
            if (a.textContent.includes('Submission Forms')) {
                if (pendingCount > 0) {
                    a.innerHTML = `Submission Forms <span style="background:#e55039; color:#fff; font-size:11px; padding:2px 7px; border-radius:10px; margin-left:6px; font-weight:700;">${pendingCount}</span>`;
                } else {
                    a.innerHTML = `Submission Forms`;
                }
            }
        });
    };

    updatePendingAppsBadge();
    window.addEventListener('igyr_data_updated', updatePendingAppsBadge);

});
