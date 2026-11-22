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
        const instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
        let instName = 'IGYR Educational Institution';
        try {
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
            vid: `IGYR-DEMO-2026101-9482`,
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

    window.openTemplatePreview = function(initialTpl = 'photo_pro') {
        let modal = document.getElementById('tpl-preview-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'tpl-preview-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(7, 29, 73, 0.75); backdrop-filter: blur(8px);
                z-index: 100000; display: flex; flex-direction: column;
                align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;
            `;

            modal.innerHTML = `
                <div style="background: #ffffff; width: 100%; max-width: 950px; height: 92vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.3);">
                    <!-- Modal Header -->
                    <div style="background: #062b63; color: #fff; padding: 14px 22px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d4af37;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">🎨</span>
                            <h3 style="margin: 0; font-size: 17px; font-weight: 800; letter-spacing: 0.5px;">Official Marksheet Template Live Previewer</h3>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button id="tpl-modal-popout" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">↗ Open Fullscreen</button>
                            <button id="tpl-modal-close" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; line-height: 1; padding: 0 4px;">✕</button>
                        </div>
                    </div>
                    
                    <!-- Tabs Bar -->
                    <div style="background: #f1f5f9; padding: 10px 18px; display: flex; gap: 8px; border-bottom: 1px solid #cbd5e1; overflow-x: auto;" id="tpl-tab-bar">
                        <button class="tpl-tab-btn" data-tpl="photo_pro" style="padding: 7px 15px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 700; font-size: 13px; cursor: pointer; color: #062b63;">⭐ Photo Pro (With Photo)</button>
                        <button class="tpl-tab-btn" data-tpl="classic" style="padding: 7px 15px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 700; font-size: 13px; cursor: pointer; color: #062b63;">🏛️ Classic Royal</button>
                        <button class="tpl-tab-btn" data-tpl="modern" style="padding: 7px 15px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 700; font-size: 13px; cursor: pointer; color: #062b63;">🎨 Modern Elegance</button>
                        <button class="tpl-tab-btn" data-tpl="certificate" style="padding: 7px 15px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-weight: 700; font-size: 13px; cursor: pointer; color: #062b63;">📜 Academic Diploma</button>
                    </div>

                    <!-- Iframe Container -->
                    <div style="flex: 1; background: #e2e8f0; position: relative;">
                        <iframe id="tpl-preview-iframe" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close listeners
            document.getElementById('tpl-modal-close').onclick = () => { modal.style.display = 'none'; };
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });

            // Popout listener
            document.getElementById('tpl-modal-popout').onclick = () => {
                const currentTpl = modal.getAttribute('data-active-tpl') || 'photo_pro';
                sessionStorage.setItem('current_result', JSON.stringify(getPreviewData(currentTpl)));
                window.open('result.html', '_blank');
            };

            // Tab listeners
            modal.querySelectorAll('.tpl-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    const tpl = btn.getAttribute('data-tpl');
                    switchPreviewTab(tpl);
                };
            });
        }

        modal.style.display = 'flex';
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

        // Load preview data into sessionStorage and reload iframe
        const sampleData = getPreviewData(tpl);
        sessionStorage.setItem('current_result', JSON.stringify(sampleData));

        const iframe = document.getElementById('tpl-preview-iframe');
        if (iframe) {
            iframe.src = 'result.html?v=' + Date.now();
        }
    }

    // Auto-wire buttons on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        // Step 2 Preview button on upload page
        const btnUploadPreview = document.getElementById('btn-preview-tpl');
        if (btnUploadPreview) {
            btnUploadPreview.addEventListener('click', () => {
                const sel = document.getElementById('marksheet-template');
                const tpl = sel ? sel.value : 'photo_pro';
                openTemplatePreview(tpl);
            });
        }

        // Dashboard gallery button
        const btnGallery = document.getElementById('btn-open-tpl-gallery');
        if (btnGallery) {
            btnGallery.addEventListener('click', () => {
                openTemplatePreview('photo_pro');
            });
        }

        // Tabulation template preview button
        const btnTabPreview = document.getElementById('btn-tab-preview-tpl');
        if (btnTabPreview) {
            btnTabPreview.addEventListener('click', () => {
                const sel = document.getElementById('exam-template-changer');
                const tpl = sel ? sel.value : 'photo_pro';
                openTemplatePreview(tpl);
            });
        }
    });
})();
