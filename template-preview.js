// Marksheet Template Live Previewer Modal for Admin & Institute Panels

(function() {
    // Clean SVG sample student portrait
    const samplePortrait = "data:image/svg+xml;utf8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="200" viewBox="0 0 160 200">
            <rect width="160" height="200" fill="#e2e8f0"/>
            <circle cx="80" cy="70" r="38" fill="#94a3b8"/>
            <path d="M20 190 C20 130, 140 130, 140 190 Z" fill="#64748b"/>
            <circle cx="80" cy="65" r="30" fill="#f8fafc"/>
            <path d="M50 65 Q80 100 110 65" stroke="#64748b" stroke-width="3" fill="none"/>
            <rect x="0" y="175" width="160" height="25" fill="#062b63"/>
            <text x="80" y="192" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">OFFICIAL SAMPLE</text>
        </svg>
    `);

    function getPreviewData(tpl) {
        let instName = 'IGYR Educational Institution';
        let instId = 'IGYR001';
        try {
            instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
            if (typeof getInstitutes === 'function') {
                const inst = getInstitutes().find(i => i.id === instId);
                if (inst && inst.name) instName = inst.name;
            }
        } catch(e) {}

        return {
            name: "AARAV RAJESH SHARMA",
            fname: "RAJESH SHARMA",
            mname: "SUNITA SHARMA",
            roll: "2026101",
            reg: "IGYR-REG-94821",
            instId: instId,
            instName: instName,
            exam: "SENIOR ACADEMIC BOARD EXAMINATION",
            date: new Date().toLocaleDateString('en-GB'),
            vid: "IGYR-DEMO-2026101-9482",
            template: tpl || 'photo_pro',
            photo: samplePortrait,
            marks: [
                { sub: "Physics", max: 100, obt: 94 },
                { sub: "Chemistry", max: 100, obt: 89 },
                { sub: "Mathematics", max: 100, obt: 98 },
                { sub: "English Core", max: 100, obt: 91 },
                { sub: "Computer Science", max: 100, obt: 96 }
            ]
        };
    }

    window.openTemplatePreview = function(initialTpl) {
        initialTpl = initialTpl || 'photo_pro';
        let modal = document.getElementById('tpl-preview-modal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'tpl-preview-modal';
            modal.style.cssText = `
                position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;
                background: rgba(7, 29, 73, 0.8) !important; backdrop-filter: blur(8px) !important;
                z-index: 9999999 !important; display: flex !important; flex-direction: column !important;
                align-items: center !important; justify-content: center !important; padding: 15px !important; box-sizing: border-box !important;
            `;

            modal.innerHTML = `
                <div style="background: #ffffff; width: 100%; max-width: 980px; height: 92vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.4);">
                    <!-- Modal Header -->
                    <div style="background: #062b63; color: #fff; padding: 14px 22px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d4af37;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">🎨</span>
                            <h3 style="margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">Official Marksheet Template Live Previewer</h3>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button id="tpl-modal-popout" type="button" style="background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px;">↗ Open Fullscreen</button>
                            <button id="tpl-modal-close" type="button" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; line-height: 1; padding: 0 6px;">✕</button>
                        </div>
                    </div>
                    
                    <!-- Tabs Bar -->
                    <div style="background: #f1f5f9; padding: 10px 18px; display: flex; gap: 8px; border-bottom: 1px solid #cbd5e1; overflow-x: auto;" id="tpl-tab-bar">
                        <button type="button" class="tpl-tab-btn" data-tpl="photo_pro" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 700; font-size: 13px; cursor: pointer; color: #062b63; white-space: nowrap;">⭐ Photo Pro (With Photo Frame)</button>
                        <button type="button" class="tpl-tab-btn" data-tpl="classic" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 700; font-size: 13px; cursor: pointer; color: #062b63; white-space: nowrap;">🏛️ Classic Royal</button>
                        <button type="button" class="tpl-tab-btn" data-tpl="modern" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 700; font-size: 13px; cursor: pointer; color: #062b63; white-space: nowrap;">🎨 Modern Elegance</button>
                        <button type="button" class="tpl-tab-btn" data-tpl="certificate" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 700; font-size: 13px; cursor: pointer; color: #062b63; white-space: nowrap;">📜 Academic Diploma Certificate</button>
                    </div>

                    <!-- Iframe Container -->
                    <div style="flex: 1; background: #e2e8f0; position: relative;">
                        <iframe id="tpl-preview-iframe" title="Marksheet Preview" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close listeners
            const closeBtn = document.getElementById('tpl-modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => { modal.style.display = 'none'; };
            }
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });

            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display !== 'none') {
                    modal.style.display = 'none';
                }
            });

            // Popout listener
            const popoutBtn = document.getElementById('tpl-modal-popout');
            if (popoutBtn) {
                popoutBtn.onclick = () => {
                    const currentTpl = modal.getAttribute('data-active-tpl') || 'photo_pro';
                    try {
                        sessionStorage.setItem('current_result', JSON.stringify(getPreviewData(currentTpl)));
                    } catch(e) {}
                    window.open('result.html?preview=1&tpl=' + encodeURIComponent(currentTpl), '_blank');
                };
            }

            // Tab listeners
            modal.querySelectorAll('.tpl-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    const tpl = btn.getAttribute('data-tpl');
                    switchPreviewTab(tpl);
                };
            });
        }

        modal.style.setProperty('display', 'flex', 'important');
        switchPreviewTab(initialTpl);
    };

    function switchPreviewTab(tpl) {
        const modal = document.getElementById('tpl-preview-modal');
        if (!modal) return;
        modal.setAttribute('data-active-tpl', tpl);

        // Update active tab styles
        modal.querySelectorAll('.tpl-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tpl') === tpl) {
                btn.style.background = '#062b63';
                btn.style.color = '#ffffff';
                btn.style.borderColor = '#062b63';
            } else {
                btn.style.background = '#ffffff';
                btn.style.color = '#062b63';
                btn.style.borderColor = '#cbd5e1';
            }
        });

        // Set sample result in sessionStorage
        try {
            sessionStorage.setItem('current_result', JSON.stringify(getPreviewData(tpl)));
        } catch(e) {}

        const iframe = document.getElementById('tpl-preview-iframe');
        if (iframe) {
            iframe.src = 'result.html?preview=1&tpl=' + encodeURIComponent(tpl) + '&v=' + Date.now();
        }
    }

    // Direct event delegation so any button works immediately without waiting for DOMContentLoaded
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('#btn-open-tpl-gallery, #btn-preview-tpl, #btn-tab-preview-tpl, [data-open-tpl-preview]');
        if (btn) {
            e.preventDefault();
            let tpl = 'photo_pro';
            if (btn.id === 'btn-preview-tpl') {
                const sel = document.getElementById('marksheet-template');
                if (sel && sel.value) tpl = sel.value;
            } else if (btn.id === 'btn-tab-preview-tpl') {
                const sel = document.getElementById('exam-template-changer');
                if (sel && sel.value) tpl = sel.value;
            } else if (btn.dataset && btn.dataset.openTplPreview) {
                tpl = btn.dataset.openTplPreview;
            }
            window.openTemplatePreview(tpl);
        }
    });

    // Auto-wire buttons if DOM is ready or becomes ready
    function wireButtons() {
        const btnGallery = document.getElementById('btn-open-tpl-gallery');
        if (btnGallery && !btnGallery._tplWired) {
            btnGallery._tplWired = true;
            btnGallery.addEventListener('click', (e) => {
                e.preventDefault();
                window.openTemplatePreview('photo_pro');
            });
        }

        const btnUploadPreview = document.getElementById('btn-preview-tpl');
        if (btnUploadPreview && !btnUploadPreview._tplWired) {
            btnUploadPreview._tplWired = true;
            btnUploadPreview.addEventListener('click', (e) => {
                e.preventDefault();
                const sel = document.getElementById('marksheet-template');
                const tpl = sel ? sel.value : 'photo_pro';
                window.openTemplatePreview(tpl);
            });
        }

        const btnTabPreview = document.getElementById('btn-tab-preview-tpl');
        if (btnTabPreview && !btnTabPreview._tplWired) {
            btnTabPreview._tplWired = true;
            btnTabPreview.addEventListener('click', (e) => {
                e.preventDefault();
                const sel = document.getElementById('exam-template-changer');
                const tpl = sel ? sel.value : 'photo_pro';
                window.openTemplatePreview(tpl);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireButtons);
    } else {
        wireButtons();
    }
})();
