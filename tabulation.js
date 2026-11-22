document.addEventListener('DOMContentLoaded', () => {
    const instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
    const examSelect = document.getElementById('tab-exam-select');
    const btnView = document.getElementById('btn-view-tab');
    const container = document.getElementById('tabulation-container');
    
    // Toast notification helper
    function showToast(msg, isSuccess = true) {
        let toast = document.getElementById('tab-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'tab-toast';
            toast.style.cssText = 'position:fixed; bottom:25px; right:25px; z-index:99999; padding:12px 22px; border-radius:8px; font-weight:700; font-size:14px; box-shadow:0 8px 25px rgba(0,0,0,0.2); transition:all 0.3s; color:#fff; display:none;';
            document.body.appendChild(toast);
        }
        toast.style.background = isSuccess ? '#16a34a' : '#dc2626';
        toast.innerHTML = msg;
        toast.style.display = 'block';
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { toast.style.display = 'none'; }, 300);
        }, 3200);
    }

    // Helper: Client-side photo compression via HTML5 Canvas
    function compressPhoto(file, callback) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPG, PNG, WEBP).');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const targetW = 160;
                const targetH = 200;
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                
                // Crop and scale to fit target aspect ratio (4:5 portrait)
                const aspect = img.width / img.height;
                const targetAspect = targetW / targetH;
                let sx = 0, sy = 0, sW = img.width, sH = img.height;
                if (aspect > targetAspect) {
                    sW = img.height * targetAspect;
                    sx = (img.width - sW) / 2;
                } else {
                    sH = img.width / targetAspect;
                    sy = (img.height - sH) / 2;
                }
                ctx.drawImage(img, sx, sy, sW, sH, 0, 0, targetW, targetH);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                callback(compressedBase64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Load results and ensure VIDs exist
    let allStored = getResults();
    let needsSave = false;
    allStored.forEach((r, i) => {
        if (!r.vid) {
            const cInst = (r.instId || 'INST').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
            const cRoll = String(r.roll || ('STU' + (i + 1))).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            r.vid = `IGYR-${cInst}-${cRoll}-${Math.floor(1000 + Math.random() * 9000)}`;
            needsSave = true;
        }
        if (!r.template) {
            r.template = 'photo_pro';
            needsSave = true;
        }
    });
    if (needsSave) {
        saveResults(allStored);
    }

    // Get all results for this institute
    const allResults = allStored.filter(r => r.instId === instId);
    
    // Find unique exams
    const exams = [...new Set(allResults.map(r => r.exam))];
    
    if (exams.length === 0) {
        examSelect.innerHTML = '<option value="">No Exams Published Yet</option>';
        btnView.disabled = true;
    } else {
        examSelect.innerHTML = '<option value="">-- Select Exam --</option>';
        exams.forEach(ex => {
            let opt = document.createElement('option');
            opt.value = ex;
            opt.textContent = ex;
            examSelect.appendChild(opt);
        });
    }

    function renderTabulation() {
        const examName = examSelect.value;
        if (!examName) return;
        
        // Refresh dataset
        const currentData = getResults().filter(r => r.instId === instId && r.exam === examName);
        if (currentData.length === 0) return;
        
        // Extract all unique subjects to form table headers
        let subjectsMap = new Set();
        currentData.forEach(row => {
            if (row.marks && Array.isArray(row.marks)) {
                row.marks.forEach(m => subjectsMap.add(m.sub || m.subject || 'Subject'));
            }
        });
        const subjects = Array.from(subjectsMap);
        
        const inst = getInstitutes().find(i => i.id === instId);
        const currentTemplate = currentData[0].template || 'photo_pro';

        let html = `
            <div style="text-align:center; margin-bottom: 20px; background:#f1f5f9; padding:20px; border-radius:12px; border:1px solid #cbd5e1;">
                <h2 style="color:var(--primary); margin:0; font-size:24px; font-weight:800; letter-spacing:0.5px;">TABULATION REGISTER</h2>
                <h3 style="margin:8px 0 4px 0; color:#062b63; font-size:18px;">Exam: ${examName}</h3>
                <p style="color:#555; margin:0; font-size:14px;"><strong>${inst ? inst.name : ''}</strong> | Declaration Date: ${currentData[0].date || 'N/A'} | Total Students: ${currentData.length}</p>
                
                <div class="no-print" style="margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; background: #fff; padding: 10px 18px; border-radius: 8px; border: 1px solid #e2e8f0; width: fit-content; margin-left: auto; margin-right: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">
                    <label for="exam-template-changer" style="font-weight: 700; font-size: 13.5px; color: #062b63;">Marksheet Template Style:</label>
                    <select id="exam-template-changer" style="padding: 6px 12px; border: 1px solid #cde0f5; border-radius: 6px; font-weight: 600; font-size: 13px; color: #062b63; background: #f8fbff;">
                        <option value="photo_pro" ${currentTemplate === 'photo_pro' ? 'selected' : ''}>⭐ Photo Pro Marksheet (With Student Photo)</option>
                        <option value="classic" ${currentTemplate === 'classic' ? 'selected' : ''}>🏛️ Classic Royal Marksheet</option>
                        <option value="modern" ${currentTemplate === 'modern' ? 'selected' : ''}>🎨 Modern Elegance Marksheet</option>
                        <option value="certificate" ${currentTemplate === 'certificate' ? 'selected' : ''}>📜 Academic Diploma Certificate</option>
                    </select>
                    <button id="btn-save-exam-template" class="btn" style="background:#1266d6; color:white; padding:6px 14px; font-size:12.5px; font-weight:700; border-radius:6px; cursor:pointer;">Update Template for All</button>
                    <button id="btn-tab-preview-tpl" class="btn" style="background:#062b63; color:white; padding:6px 14px; font-size:12.5px; font-weight:700; border-radius:6px; cursor:pointer;">👁️ Preview Template</button>
                </div>
            </div>

            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;" class="no-print">
                <span style="font-size: 13px; color: #64748b; font-weight: 600;">💡 Tip: Click <strong>"📷 Upload Photo"</strong> to attach individual student photos one-by-one. Photos appear on the Marksheet instantly.</span>
            </div>

            <table class="table" style="width:100%; text-align:center; border-collapse: collapse; min-width:950px; background:#fff; box-shadow:0 2px 10px rgba(0,0,0,0.04); border-radius:8px; overflow:hidden;">
                <thead>
                    <tr style="background-color:#062b63; color:#fff; font-size:13px;">
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; width:50px;">Sl. No.</th>
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; width:90px;">Photo</th>
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; width:130px; text-align:center;">Verification ID (VID)</th>
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; text-align:left; width:100px;">Roll No</th>
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; text-align:left; width:100px;">Reg No</th>
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; text-align:left; min-width:140px;">Student Name</th>
        `;
        
        subjects.forEach(sub => {
            html += `<th style="padding:10px 8px; border:1px solid #cbd5e1;">${sub}</th>`;
        });
        
        html += `       <th style="padding:10px 8px; border:1px solid #cbd5e1; width:65px;">Total</th>
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; width:75px;">%</th>
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; width:70px;">Result</th>
                        <th style="padding:10px 8px; border:1px solid #cbd5e1; width:100px;" class="no-print">Marksheet</th>
                    </tr>
                </thead>
                <tbody>`;
                 
        currentData.forEach((row, idx) => {
            let rowTotal = 0;
            let rowMax = subjects.length * 100;
            
            // pre-map student's marks for easy lookup
            let markMap = {};
            if (row.marks && Array.isArray(row.marks)) {
                row.marks.forEach(m => { 
                    markMap[m.sub || m.subject] = parseInt(m.obt || m.marks) || 0; 
                });
            }
            
            let subsHtml = '';
            let failed = false;
            subjects.forEach(sub => {
                let m = markMap[sub] !== undefined ? markMap[sub] : '-';
                if (m !== '-' && m < 33) failed = true;
                if (m !== '-') rowTotal += m;
                subsHtml += `<td style="padding:8px; border:1px solid #cbd5e1; font-weight:600;">${m}</td>`;
            });
            
            let percentage = rowMax > 0 ? ((rowTotal / rowMax) * 100).toFixed(2) + '%' : '0%';
            let resultStatus = failed ? '<span style="color:#dc2626; font-weight:800; background:#fef2f2; padding:3px 8px; border-radius:4px; border:1px solid #fecaca;">FAIL</span>' : '<span style="color:#16a34a; font-weight:800; background:#f0fdf4; padding:3px 8px; border-radius:4px; border:1px solid #bbf7d0;">PASS</span>';
            
            // Photo Column HTML
            let photoHtml = '';
            if (row.photo && row.photo.length > 30) {
                photoHtml = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <img src="${row.photo}" alt="${row.name}" style="width:48px; height:58px; object-fit:cover; border-radius:4px; border:2px solid #1266d6; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        <div class="no-print" style="display:flex; gap:4px;">
                            <button class="btn-change-photo" data-roll="${row.roll}" data-reg="${row.reg}" style="background:#f1f5f9; color:#062b63; border:1px solid #cbd5e1; font-size:10px; font-weight:700; padding:2px 6px; border-radius:3px; cursor:pointer;">Edit</button>
                            <button class="btn-del-photo" data-roll="${row.roll}" data-reg="${row.reg}" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; font-size:10px; font-weight:700; padding:2px 5px; border-radius:3px; cursor:pointer;" title="Remove Photo">✕</button>
                        </div>
                    </div>
                `;
            } else {
                photoHtml = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <div style="width:46px; height:56px; background:#f8fafc; border:1.5px dashed #94a3b8; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:20px; color:#94a3b8;">
                            👤
                        </div>
                        <button class="btn-upload-photo no-print" data-roll="${row.roll}" data-reg="${row.reg}" style="background:#1266d6; color:white; border:none; font-size:10.5px; font-weight:700; padding:3px 8px; border-radius:4px; cursor:pointer; white-space:nowrap;">📷 Upload</button>
                    </div>
                `;
            }

            html += `<tr>
                <td style="padding:8px; border:1px solid #cbd5e1; font-weight:600;">${idx + 1}</td>
                <td style="padding:6px; border:1px solid #cbd5e1;">${photoHtml}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;">
                    <span style="font-family:monospace; font-size:11.5px; font-weight:700; color:#062b63; background:#eaf6ff; padding:3px 6px; border-radius:4px; border:1px solid #cde0f5; display:inline-block; word-break:break-all;">${row.vid}</span>
                </td>
                <td style="padding:8px; border:1px solid #cbd5e1; text-align:left; font-weight:600;">${row.roll}</td>
                <td style="padding:8px; border:1px solid #cbd5e1; text-align:left;">${row.reg}</td>
                <td style="padding:8px; border:1px solid #cbd5e1; text-align:left; font-weight:700; color:#062b63;">${row.name}</td>
                ${subsHtml}
                <td style="padding:8px; border:1px solid #cbd5e1; font-weight:800; color:#062b63;">${rowTotal}</td>
                <td style="padding:8px; border:1px solid #cbd5e1; font-weight:700;">${percentage}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;">${resultStatus}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;" class="no-print">
                    <button class="btn-preview-marksheet" data-roll="${row.roll}" data-reg="${row.reg}" style="background:#062b63; color:#fff; border:none; padding:5px 10px; border-radius:4px; font-size:11.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:0.2s;">
                        👁️ Marksheet
                    </button>
                </td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
        
        const printBtn = document.getElementById('btn-print-tab');
        if (printBtn) printBtn.style.display = 'inline-block';

        // Hidden file input for photo uploads
        let photoPicker = document.getElementById('dynamic-photo-picker');
        if (!photoPicker) {
            photoPicker = document.createElement('input');
            photoPicker.type = 'file';
            photoPicker.id = 'dynamic-photo-picker';
            photoPicker.accept = 'image/*';
            photoPicker.style.display = 'none';
            document.body.appendChild(photoPicker);
        }

        let pendingTargetRoll = null;
        let pendingTargetReg = null;

        photoPicker.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            compressPhoto(file, (base64Img) => {
                const freshResults = getResults();
                const targetStudent = freshResults.find(r => r.instId === instId && r.exam === examName && r.roll === pendingTargetRoll && r.reg === pendingTargetReg);
                if (targetStudent) {
                    targetStudent.photo = base64Img;
                    saveResults(freshResults);
                    showToast(`✅ Photo saved for ${targetStudent.name}!`);
                    renderTabulation();
                } else {
                    alert('Student not found in results.');
                }
            });
            photoPicker.value = '';
        };

        // Attach Upload & Edit listeners
        container.querySelectorAll('.btn-upload-photo, .btn-change-photo').forEach(btn => {
            btn.addEventListener('click', () => {
                pendingTargetRoll = btn.getAttribute('data-roll');
                pendingTargetReg = btn.getAttribute('data-reg');
                photoPicker.click();
            });
        });

        // Attach Delete Photo listeners
        container.querySelectorAll('.btn-del-photo').forEach(btn => {
            btn.addEventListener('click', () => {
                const roll = btn.getAttribute('data-roll');
                const reg = btn.getAttribute('data-reg');
                if (confirm('Are you sure you want to remove this student photo?')) {
                    const freshResults = getResults();
                    const targetStudent = freshResults.find(r => r.instId === instId && r.exam === examName && r.roll === roll && r.reg === reg);
                    if (targetStudent) {
                        targetStudent.photo = '';
                        saveResults(freshResults);
                        showToast(`Photo removed for ${targetStudent.name}.`);
                        renderTabulation();
                    }
                }
            });
        });

        // Attach Preview Marksheet listeners
        container.querySelectorAll('.btn-preview-marksheet').forEach(btn => {
            btn.addEventListener('click', () => {
                const roll = btn.getAttribute('data-roll');
                const reg = btn.getAttribute('data-reg');
                const freshResults = getResults();
                const targetStudent = freshResults.find(r => r.instId === instId && r.exam === examName && r.roll === roll && r.reg === reg);
                if (targetStudent) {
                    sessionStorage.setItem('current_result', JSON.stringify(targetStudent));
                    window.open('result.html', '_blank');
                } else {
                    alert('Result not found.');
                }
            });
        });

        // Attach Exam Template Switcher listener
        const btnSaveTemplate = document.getElementById('btn-save-exam-template');
        if (btnSaveTemplate) {
            btnSaveTemplate.addEventListener('click', () => {
                const sel = document.getElementById('exam-template-changer');
                if (!sel) return;
                const newTpl = sel.value;
                const freshResults = getResults();
                let count = 0;
                freshResults.forEach(r => {
                    if (r.instId === instId && r.exam === examName) {
                        r.template = newTpl;
                        count++;
                    }
                });
                saveResults(freshResults);
                showToast(`🎉 Marksheet template updated to "${newTpl.toUpperCase()}" for ${count} students!`);
                renderTabulation();
            });
        }

        // Attach Tabulation Template Preview listener
        const btnTabPreview = document.getElementById('btn-tab-preview-tpl');
        if (btnTabPreview) {
            btnTabPreview.addEventListener('click', () => {
                const sel = document.getElementById('exam-template-changer');
                const tpl = sel ? sel.value : 'photo_pro';
                if (typeof window.openTemplatePreview === 'function') {
                    window.openTemplatePreview(tpl);
                }
            });
        }
    }

    btnView.addEventListener('click', () => {
        const examName = examSelect.value;
        if (!examName) {
            alert('Please select an exam first.');
            return;
        }
        renderTabulation();
    });
});
