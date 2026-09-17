
document.addEventListener('DOMContentLoaded', () => {
    
    const instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';

    // Update Sidebar Institute Name
    const sidebarInstName = document.getElementById('sidebar-inst-name');
    if (sidebarInstName) {
        const inst = getInstitutes().find(i => i.id === instId);
        sidebarInstName.textContent = inst ? inst.name : 'Institute Panel';
    }


    // Populate Dashboard Table
    window.renderInstituteDashboard = function() {
        const savedBody = document.getElementById('saved-results-body');
    if (savedBody) {
        const allResults = getResults().filter(r => r.instId === instId);
        
        let examsMap = {};
        allResults.forEach(r => {
            if (!examsMap[r.exam]) {
                examsMap[r.exam] = {
                    date: r.date || 'N/A',
                    count: 0,
                    status: r.status || 'DRAFT'
                };
            }
            examsMap[r.exam].count++;
        });

        if (Object.keys(examsMap).length === 0) {
            savedBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#777; padding: 25px;">No results uploaded yet.</td></tr>';
        } else {
            Object.keys(examsMap).forEach(examName => {
                let info = examsMap[examName];
                let tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${examName}</td>
                    <td>${info.date}</td>
                    <td>${info.count}</td>
                    <td><span class="badge ${info.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'}">${info.status}</span></td>
                    <td>
                        <button class="btn btn-outline" style="color: #e55039; border-color: #e55039;" onclick="deleteExamResult('${examName}')">Delete</button>
                    </td>
                `;
                savedBody.appendChild(tr);
            });
        }
        
        const countEl = document.getElementById('dash-stu-count');
        const pubEl = document.getElementById('dash-pub-count');
        if (countEl) countEl.textContent = allResults.length;
        if (pubEl) pubEl.textContent = Object.values(examsMap).filter(x => x.status === 'PUBLISHED').length;
        }
    };
    window.renderInstituteDashboard();
    
    // Populate Drafts Table (Manage Drafts Page)
    window.renderInstituteDrafts = function() {
        const draftsBody = document.getElementById('drafts-body');
        if(draftsBody) draftsBody.innerHTML = '';
    if (draftsBody) {
        const allResults = getResults().filter(r => r.instId === instId);
        
        let examsMap = {};
        allResults.forEach(r => {
            if (!examsMap[r.exam]) {
                examsMap[r.exam] = {
                    date: r.date || 'N/A',
                    count: 0,
                    status: r.status || 'DRAFT'
                };
            }
            examsMap[r.exam].count++;
        });

        if (Object.keys(examsMap).length === 0) {
            draftsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#777; padding: 25px;">No saved results or drafts found.</td></tr>';
        } else {
            Object.keys(examsMap).forEach(examName => {
                let info = examsMap[examName];
                let tr = document.createElement('tr');
                let actionBtn = info.status === 'DRAFT' 
                    ? `<button class="btn btn-primary" onclick="togglePublishStatus('${examName}', 'PUBLISHED')">Publish</button>`
                    : `<button class="btn btn-outline" style="color:var(--primary);border-color:var(--primary);" onclick="togglePublishStatus('${examName}', 'DRAFT')">Unpublish</button>`;

                tr.innerHTML = `
                    <td>${examName}</td>
                    <td>${info.date}</td>
                    <td>${info.count}</td>
                    <td><span class="badge ${info.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'}">${info.status}</span></td>
                    <td>${actionBtn}</td>
                `;
                draftsBody.appendChild(tr);
            });
        }
    }
    };
    window.renderInstituteDrafts();

    // Populate Tabulation Table
    window.renderInstituteTabulation = function() {
        const tabBody = document.getElementById('tabulation-body');
        if(tabBody) tabBody.innerHTML = '';
    if (tabBody) {
        const publishedResults = getResults().filter(r => r.instId === instId && r.status === 'PUBLISHED');
        publishedResults.forEach(r => {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.reg}</td>
                <td>${r.roll}</td>
                <td>${r.name}</td>
                <td>${r.exam}</td>
                <td><button class="btn btn-primary" onclick="viewResult('${r.reg}', '${r.roll}', '${r.exam}')">View</button></td>
            `;
            tabBody.appendChild(tr);
        });
    }
    };
    window.renderInstituteTabulation();

    // Settings Logic
    
    // Load existing images into previews
    const loadPreviews = () => {
        let insts = getInstitutes();
        let instObj = insts.find(i => i.id === instId);
        if (instObj) {
            const pLogo = document.getElementById('preview-logo');
            const pSign = document.getElementById('preview-sign');
            const noLogo = document.getElementById('no-logo-text');
            const noSign = document.getElementById('no-sign-text');
            const btnRmLogo = document.getElementById('btn-remove-logo');
            const btnRmSign = document.getElementById('btn-remove-sign');
            
            if (pLogo && instObj.logo) {
                pLogo.src = instObj.logo; pLogo.style.display = 'block';
                if(noLogo) noLogo.style.display = 'none';
                if(btnRmLogo) btnRmLogo.style.display = 'block';
            } else if (pLogo) {
                pLogo.style.display = 'none';
                if(noLogo) noLogo.style.display = 'block';
                if(btnRmLogo) btnRmLogo.style.display = 'none';
            }
            
            if (pSign && instObj.signature) {
                pSign.src = instObj.signature; pSign.style.display = 'block';
                if(noSign) noSign.style.display = 'none';
                if(btnRmSign) btnRmSign.style.display = 'block';
            } else if (pSign) {
                pSign.style.display = 'none';
                if(noSign) noSign.style.display = 'block';
                if(btnRmSign) btnRmSign.style.display = 'none';
            }
        }
    };
    
    // Call it immediately on load
    loadPreviews();

    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
            const logoInput = document.getElementById('inst-update-logo');
            const signInput = document.getElementById('inst-update-sign');
            
            const readFileAsDataURL = (file) => new Promise((resolve) => {
                if (!file) return resolve(null);
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });

            Promise.all([
                readFileAsDataURL(logoInput && logoInput.files ? logoInput.files[0] : null),
                readFileAsDataURL(signInput && signInput.files ? signInput.files[0] : null)
            ]).then(([logoBase64, signBase64]) => {
                let insts = getInstitutes();
                let idx = insts.findIndex(i => i.id === instId);
                if (idx !== -1) {
                    if (logoBase64) insts[idx].logo = logoBase64;
                    if (signBase64) insts[idx].signature = signBase64;
                    
                    // Check if remove flags are set
                    if (window._removeLogoFlag) {
                        delete insts[idx].logo;
                        window._removeLogoFlag = false;
                    }
                    if (window._removeSignFlag) {
                        delete insts[idx].signature;
                        window._removeSignFlag = false;
                    }
                    
                    saveInstitutes(insts);
                    alert("Institute settings updated successfully!"); loadPreviews();
                    if(logoInput) logoInput.value = "";
                    if(signInput) signInput.value = "";
                }
            });
        });
        
        const btnRemoveLogo = document.getElementById('btn-remove-logo');
        if (btnRemoveLogo) {
            btnRemoveLogo.addEventListener('click', (e) => {
                e.preventDefault();
                window._removeLogoFlag = true; document.getElementById('preview-logo').style.display = 'none'; document.getElementById('no-logo-text').style.display = 'block'; document.getElementById('btn-remove-logo').style.display = 'none';
                if (document.getElementById('inst-update-logo')) {
                    document.getElementById('inst-update-logo').value = "";
                }
                alert("Logo marked for removal. Click 'Save Changes' to confirm.");
            });
        }
        
        const btnRemoveSign = document.getElementById('btn-remove-sign');
        if (btnRemoveSign) {
            btnRemoveSign.addEventListener('click', (e) => {
                e.preventDefault();
                window._removeSignFlag = true; document.getElementById('preview-sign').style.display = 'none'; document.getElementById('no-sign-text').style.display = 'block'; document.getElementById('btn-remove-sign').style.display = 'none';
                if (document.getElementById('inst-update-sign')) {
                    document.getElementById('inst-update-sign').value = "";
                }
                alert("Signature marked for removal. Click 'Save Changes' to confirm.");
            });
        }
    }



    window.addEventListener('igyr_data_updated', () => {
        console.log("Institute Auto-updating...");
        if(typeof window.renderInstituteDashboard === 'function') window.renderInstituteDashboard();
        if(typeof window.renderInstituteDrafts === 'function') window.renderInstituteDrafts();
        if(typeof window.renderInstituteTabulation === 'function') window.renderInstituteTabulation();
    });

}); // End DOMContentLoaded

// Global functions
window.togglePublishStatus = function(examName, newStatus) {
    if(confirm(`Are you sure you want to change status to ${newStatus}?`)) {
        let instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
        let results = getResults();
        results.forEach(r => {
            if(r.instId === instId && r.exam === examName) {
                r.status = newStatus;
            }
        });
        saveResults(results).then(() => {
            alert(`Result status successfully changed to ${newStatus}!`);
            if (typeof window.renderInstituteDrafts === 'function') window.renderInstituteDrafts();
            if (typeof window.renderInstituteDashboard === 'function') window.renderInstituteDashboard();
        });
    }
}

window.deleteExamResult = function(examName) {
    if(confirm(`Are you sure you want to permanently delete ALL results for ${examName}?`)) {
        let instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
        let results = getResults().filter(r => !(r.instId === instId && r.exam === examName));
        saveResults(results).then(() => {
            alert(`Result status successfully changed to ${newStatus}!`);
            if (typeof window.renderInstituteDrafts === 'function') window.renderInstituteDrafts();
            if (typeof window.renderInstituteDashboard === 'function') window.renderInstituteDashboard();
        });
    }
}

window.viewResult = function(reg, roll, exam) {
    let instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
    let results = getResults();
    let res = results.find(r => r.reg === reg && r.roll === roll && r.exam === exam && r.instId === instId);
    if(res) {
        sessionStorage.setItem('current_result', JSON.stringify(res));
        window.open('result.html', '_blank');
    }
}
