
document.addEventListener('DOMContentLoaded', () => {
    
    // Captcha Logic
    let currentCaptcha = "";

    function generateCaptcha() {
        const canvas = document.getElementById('captcha-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const chars = "123456789"; // Numbers only to avoid any confusion!
        let captcha = "";
        for(let i=0; i<4; i++) {
            captcha += chars[Math.floor(Math.random() * chars.length)];
        }
        currentCaptcha = captcha;
        console.log("Current Captcha generated: ", currentCaptcha);

        // Background dots
        for(let i=0; i<40; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#1266d6' : '#18aeea';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI*2);
            ctx.fill();
        }

        // Draw Text
        ctx.font = "bold 32px 'Caveat', cursive";
        ctx.fillStyle = '#062b63';
        ctx.textBaseline = 'middle';
        for(let i=0; i<captcha.length; i++) {
            let x = 15 + i * 22;
            let y = 25 + (Math.random() * 8 - 4); // jitter
            ctx.fillText(captcha[i], x, y);
        }
        
        // Strike lines
        for(let i=0; i<4; i++) {
            ctx.strokeStyle = 'rgba(7, 29, 73, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
    }
    
    const refreshBtn = document.getElementById('refresh-captcha');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', generateCaptcha);
        generateCaptcha(); // init on load
    }

    const stateSelects = document.querySelectorAll('#state-select');
    const distSelects = document.querySelectorAll('#district-select');
    const instSelects = document.querySelectorAll('#institute-select');
    const examSelects = document.querySelectorAll('#exam-select');
    
    // Populate states
    stateSelects.forEach((sSelect, idx) => {
        Object.keys(INDIA_STATES).forEach(state => {
            let opt = document.createElement('option');
            opt.value = state;
            opt.textContent = state;
            sSelect.appendChild(opt);
        });

        const dSelect = distSelects[idx];
        const iSelect = instSelects[idx];
        const eSelect = examSelects[idx];

        sSelect.addEventListener('change', () => {
            dSelect.innerHTML = '<option value="">Select District</option>';
            iSelect.innerHTML = '<option value="">Select Institute</option>';
            eSelect.innerHTML = '<option value="">Select Exam</option>';
            
            const dists = INDIA_STATES[sSelect.value] || [];
            dists.sort().forEach(d => {
                let opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                dSelect.appendChild(opt);
            });
        });

        dSelect.addEventListener('change', () => {
            iSelect.innerHTML = '<option value="">Select Institute</option>';
            eSelect.innerHTML = '<option value="">Select Exam</option>';
            
            const institutes = getInstitutes().filter(i => i.status === 'APPROVED' && i.state === sSelect.value && i.district === dSelect.value);
            institutes.forEach(inst => {
                let opt = document.createElement('option');
                opt.value = inst.id;
                opt.textContent = inst.name;
                iSelect.appendChild(opt);
            });
        });

        iSelect.addEventListener('change', () => {
            eSelect.innerHTML = '<option value="">Select Exam</option>';
            const results = getResults().filter(r => r.instId === iSelect.value && r.status === 'PUBLISHED');
            // Get unique exams
            const uniqueExams = [...new Set(results.map(item => item.exam))];
            uniqueExams.forEach(exam => {
                let opt = document.createElement('option');
                opt.value = exam;
                opt.textContent = exam;
                eSelect.appendChild(opt);
            });
        });
    });


    const searchForms = document.querySelectorAll('#quick-search-form, #full-search-form');
    searchForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate Captcha
            const captchaInput = form.querySelector('#captcha-input');
            if (captchaInput) {
                if (captchaInput.value.trim() !== currentCaptcha) {
                    alert('Invalid CAPTCHA code! The code is exactly 4 numbers. Please try again.');
                    generateCaptcha();
                    captchaInput.value = '';
                    return;
                }
            }
            
            const reg = form.querySelector('#reg-no').value;
            const roll = form.querySelector('#roll-no').value;
            const instId = form.querySelector('#institute-select').value;
            const exam = form.querySelector('#exam-select').value;
            
            const results = getResults();
            const res = results.find(r => r.reg === reg && r.roll === roll && r.instId === instId && r.exam === exam && r.status === 'PUBLISHED');
            if (res) {
                sessionStorage.setItem('current_result', JSON.stringify(res));
                window.location.href = 'result.html';
            } else {
                alert('Result not found. Please check details.');
            }
        });
    });

    // Render Quick Links
    window.renderQuickLinks = function() {
        const qlContainer = document.getElementById('quick-links-container');
        if (qlContainer) {
            let links = typeof getQuickLinks === "function" ? getQuickLinks() : [];
            if (!links || links.length === 0) {
                links = [
                    { text: 'Home', url: 'index.html' },
                    { text: 'About', url: 'about.html' },
                    { text: 'Results', url: 'search-result.html' },
                    { text: 'Schemes', url: 'schemes.html' }
                ];
            }


            qlContainer.innerHTML = '';
            links.forEach(l => {
                const a = document.createElement('a');
                a.textContent = l.text;
                a.href = l.url || '#';
                if (l.text.toLowerCase().includes('institute login')) {
                    a.style.color = '#fce38a';
                    a.style.fontWeight = '700';
                }
                a.onclick = function(e) {
                    if (!l.url || l.url.trim() === '' || l.url === '#') {
                        e.preventDefault();
                        alert('Link not found: This link has not been configured by the admin.');
                    }
                };
                qlContainer.appendChild(a);
            });
        }
    };
    window.renderQuickLinks();

    // Render Support & Contact
    window.renderSupportContact = function() {
        const scContainer = document.getElementById('support-contact-container');
        const scHeading = document.getElementById('footer-support-heading');
        const settings = typeof getSystemSettings === "function" ? getSystemSettings() : null;
        if (!settings) return;

        if (scHeading && settings.contactHeading) {
            scHeading.textContent = settings.contactHeading;
        }

        if (scContainer) {
            scContainer.innerHTML = '';
            
            // Email link
            if (settings.supportEmail) {
                const aMail = document.createElement('a');
                aMail.href = `mailto:${settings.supportEmail}`;
                aMail.innerHTML = `✉️ ${settings.supportEmail}`;
                scContainer.appendChild(aMail);
            }
            
            // Helpline Phone
            if (settings.helplinePhone) {
                const aPhone = document.createElement('a');
                aPhone.href = `tel:${settings.helplinePhone.replace(/\s+/g, '')}`;
                aPhone.innerHTML = `📞 ${settings.helplinePhone}`;
                scContainer.appendChild(aPhone);
            }

            // WhatsApp Support
            if (settings.whatsappSupport) {
                const aWa = document.createElement('a');
                const cleanWa = settings.whatsappSupport.replace(/[^0-9]/g, '');
                aWa.href = `https://wa.me/${cleanWa}`;
                aWa.target = "_blank";
                aWa.rel = "noopener noreferrer";
                aWa.innerHTML = `💬 WhatsApp: ${settings.whatsappSupport}`;
                scContainer.appendChild(aWa);
            }

            // Support Hours
            if (settings.supportHours) {
                const divHours = document.createElement('div');
                divHours.style.fontSize = '12px';
                divHours.style.color = '#94a3b8';
                divHours.style.margin = '4px 0';
                divHours.innerHTML = `🕒 ${settings.supportHours}`;
                scContainer.appendChild(divHours);
            }

            // Help Center URL
            if (settings.helpCenterUrl) {
                const aHelp = document.createElement('a');
                aHelp.href = settings.helpCenterUrl;
                aHelp.innerHTML = `ℹ️ Help Center & Recognition`;
                scContainer.appendChild(aHelp);
            }

            // Meet Our Founder Link
            const aFounder = document.createElement('a');
            aFounder.href = "about.html";
            aFounder.innerHTML = `👤 Meet Our Founder — Arnnav Panda`;
            aFounder.style.fontWeight = "600";
            aFounder.style.color = "#fce38a";
            scContainer.appendChild(aFounder);

            const aPriv = document.createElement('a');
            aPriv.href = "privacy.html";
            aPriv.textContent = "Privacy Policy";
            aPriv.onclick = (e) => {
                const sec = document.getElementById('policies');
                if (sec) {
                    e.preventDefault();
                    if (typeof window.switchFrontPolicyTab === 'function') {
                        window.switchFrontPolicyTab('privacy');
                    }
                    sec.scrollIntoView({ behavior: 'smooth' });
                } else if (typeof window.openPolicyModal === 'function') {
                    e.preventDefault();
                    window.openPolicyModal('privacy');
                }
            };
            scContainer.appendChild(aPriv);

            const aTerms = document.createElement('a');
            aTerms.href = "terms.html";
            aTerms.textContent = "Terms & Conditions";
            aTerms.onclick = (e) => {
                const sec = document.getElementById('policies');
                if (sec) {
                    e.preventDefault();
                    if (typeof window.switchFrontPolicyTab === 'function') {
                        window.switchFrontPolicyTab('terms');
                    }
                    sec.scrollIntoView({ behavior: 'smooth' });
                } else if (typeof window.openPolicyModal === 'function') {
                    e.preventDefault();
                    window.openPolicyModal('terms');
                }
            };
            scContainer.appendChild(aTerms);
        }
    };

    window.activeFrontPolicyTab = 'privacy';

    window.switchFrontPolicyTab = function(type) {
        window.activeFrontPolicyTab = type;
        const btnPriv = document.getElementById('tab-btn-privacy');
        const btnTerms = document.getElementById('tab-btn-terms');
        const display = document.getElementById('front-policy-display');
        const fullLink = document.getElementById('policy-full-link');
        if (!display) return;

        if (type === 'privacy') {
            if (btnPriv) {
                btnPriv.style.background = '#1266d6';
                btnPriv.style.color = '#ffffff';
                btnPriv.style.border = 'none';
            }
            if (btnTerms) {
                btnTerms.style.background = '#ffffff';
                btnTerms.style.color = '#475569';
                btnTerms.style.border = '1px solid #cbd5e1';
            }
            if (fullLink) fullLink.href = 'privacy.html';
            let text = (typeof getPrivacyPolicy === 'function') ? getPrivacyPolicy() : '';
            if (!text || text === window.DEFAULT_PRIVACY_POLICY) {
                if (window.IGYR_DB && window.IGYR_DB.settings && window.IGYR_DB.settings.privacyPolicy) {
                    text = window.IGYR_DB.settings.privacyPolicy;
                }
            }
            display.textContent = text || window.DEFAULT_PRIVACY_POLICY || 'Privacy Policy text will appear here.';
        } else {
            if (btnTerms) {
                btnTerms.style.background = '#1266d6';
                btnTerms.style.color = '#ffffff';
                btnTerms.style.border = 'none';
            }
            if (btnPriv) {
                btnPriv.style.background = '#ffffff';
                btnPriv.style.color = '#475569';
                btnPriv.style.border = '1px solid #cbd5e1';
            }
            if (fullLink) fullLink.href = 'terms.html';
            let text = (typeof getTermsConditions === 'function') ? getTermsConditions() : '';
            if (!text || text === window.DEFAULT_TERMS_CONDITIONS) {
                if (window.IGYR_DB && window.IGYR_DB.settings && window.IGYR_DB.settings.termsConditions) {
                    text = window.IGYR_DB.settings.termsConditions;
                }
            }
            display.textContent = text || window.DEFAULT_TERMS_CONDITIONS || 'Terms & Conditions text will appear here.';
        }
    };

    window.renderFrontPagePolicies = function() {
        if (typeof window.switchFrontPolicyTab === 'function') {
            window.switchFrontPolicyTab(window.activeFrontPolicyTab || 'privacy');
        }
    };

    window.openPolicyModal = function(type) {
        const existing = document.getElementById('igyr-policy-modal');
        if (existing) existing.remove();

        const isPrivacy = (type === 'privacy');
        const title = isPrivacy ? '🔒 Official Privacy Policy' : '⚖️ Official Terms & Conditions';
        let rawContent = (isPrivacy && typeof getPrivacyPolicy === 'function') 
            ? getPrivacyPolicy() 
            : ((typeof getTermsConditions === 'function') ? getTermsConditions() : '');

        if (!rawContent && window.IGYR_DB && window.IGYR_DB.settings) {
            rawContent = isPrivacy ? window.IGYR_DB.settings.privacyPolicy : window.IGYR_DB.settings.termsConditions;
        }

        const modal = document.createElement('div');
        modal.id = 'igyr-policy-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(7, 29, 73, 0.7); backdrop-filter: blur(5px);
            z-index: 100000; display: flex; align-items: center; justify-content: center;
            padding: 20px; animation: igyrPwaFadeIn 0.2s ease-out;
        `;

        modal.innerHTML = `
            <div style="background: #ffffff; color: #071d49; width: 100%; max-width: 720px; border-radius: 20px; padding: 28px 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); position: relative; max-height: 85vh; display: flex; flex-direction: column; font-family: 'Inter', -apple-system, sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin: 0; font-size: 20px; font-weight: 800; color: #071d49;">${title}</h3>
                        <span style="font-size: 12px; color: #64748b; font-weight: 600;">India Get Your Result (IGYR) Official Policy</span>
                    </div>
                    <button style="background: transparent; border: none; font-size: 24px; color: #64748b; cursor: pointer; padding: 4px 8px; line-height: 1;" onclick="document.getElementById('igyr-policy-modal').remove()">✕</button>
                </div>
                <div id="modal-policy-body" style="flex: 1; overflow-y: auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; font-size: 14px; line-height: 1.7; color: #334155; white-space: pre-wrap; word-break: break-word;">${rawContent || 'Loading policy content...'}</div>
                <div style="display: flex; justify-content: flex-end; margin-top: 18px; gap: 10px;">
                    <a href="${isPrivacy ? 'privacy.html' : 'terms.html'}" target="_blank" style="padding: 10px 18px; font-size: 13px; color: #1266d6; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center;">Open Full Page ↗</a>
                    <button style="background: #1266d6; color: white; border: none; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 8px; cursor: pointer;" onclick="document.getElementById('igyr-policy-modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (!rawContent) {
            fetch('/api/sync')
                .then(r => r.json())
                .then(d => {
                    const el = document.getElementById('modal-policy-body');
                    if (el && d && d.settings) {
                        el.textContent = isPrivacy ? d.settings.privacyPolicy : d.settings.termsConditions;
                    }
                }).catch(() => {});
        }
    };

    window.renderSupportContact();
    window.renderFrontPagePolicies();

    window.renderPublicData = function() {
        const noticeTicker = document.getElementById('notice-ticker');
        const annTicker = document.getElementById('announcement-ticker');
        const tickerWrap = document.getElementById('top-ticker-wrap');
        const tickerContent = document.getElementById('top-ticker-content');
        
        const publishedResults = getResults().filter(r => r.status === 'PUBLISHED');
        const institutes = getInstitutes();
        const globalNotices = typeof getNotices === "function" ? getNotices() : [];
        
        const uniqueNotices = [];
        const seen = new Set();
        [...publishedResults].reverse().forEach(r => {
            const key = r.instId + '_' + r.exam;
            if (!seen.has(key)) {
                seen.add(key);
                const inst = institutes.find(i => i.id === r.instId);
                if (inst) {
                    uniqueNotices.push({ exam: r.exam, instName: inst.name, district: inst.district || 'Unknown District', state: inst.state || 'Unknown State', date: r.date || 'Recently' });
                }
            }
        });

        if (noticeTicker) {
            let noticeHtml = '';
            if (uniqueNotices.length === 0) {
                noticeHtml = '<p style="text-align:center; color:#888; font-size: 16px; padding: 20px;">No results published yet.</p>';
            } else {
                noticeHtml = '<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px;">';
                uniqueNotices.forEach(n => {
                    noticeHtml += `<li style="background: #fff; padding: 20px; border: 1px solid rgba(6,43,99,0.1); border-left: 5px solid var(--primary); border-radius: 12px; display: flex; align-items: flex-start; gap: 15px; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.03);"><div style="background: rgba(18,102,214,0.1); color: var(--primary); width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">📄</div><div><h4 style="margin: 0 0 5px 0; color: #062b63; font-size: 17px; font-weight: 700;">${n.exam} Result Published</h4><p style="margin: 0; font-size: 14px; color: #4a5d7c; font-weight: 500;">🏫 ${n.instName}</p><p style="margin: 3px 0 0 0; font-size: 12px; color: #888;">📍 ${n.district}, ${n.state} &nbsp;&bull;&nbsp; 🕒 ${n.date}</p></div></li>`;
                });
                noticeHtml += '</ul>';
            }
            if (noticeTicker.innerHTML !== noticeHtml) noticeTicker.innerHTML = noticeHtml;
        }

        if (annTicker) {
            let annHtml = '';
            if (globalNotices.length === 0) {
                annHtml = '<p style="text-align:center; color:#888; font-size: 16px; padding: 20px;">No system announcements currently.</p>';
            } else {
                annHtml = '<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px;">';
                globalNotices.forEach(n => {
                    let badge = n.type === 'urgent' ? '🔴' : n.type === 'warning' ? '🟠' : '🔵';
                    let bColor = n.type === 'urgent' ? '#dc2626' : n.type === 'warning' ? '#d97706' : '#062b63';
                    let bBg = n.type === 'urgent' ? 'rgba(220,38,38,0.1)' : n.type === 'warning' ? 'rgba(217,119,6,0.1)' : 'rgba(6,43,99,0.1)';
                    annHtml += `<li style="background: #fff; padding: 20px; border: 1px solid ${bColor}; border-radius: 12px; display: flex; align-items: flex-start; gap: 18px; transition: 0.3s;"><div style="background: ${bBg}; color: ${bColor}; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 22px;">${badge}</div><div><h4 style="margin: 0 0 5px 0; color: ${bColor}; font-size: 16px; font-weight: 700; text-transform: uppercase;">${n.type} ALERT</h4><p style="margin: 0; font-size: 14px; color: #4a5d7c; line-height: 1.5;">${n.text}</p></div></li>`;
                });
                annHtml += '</ul>';
            }
            if (annTicker.innerHTML !== annHtml) annTicker.innerHTML = annHtml;
        }

        if (tickerWrap && tickerContent) {
            if (uniqueNotices.length > 0) {
                tickerWrap.style.display = 'block';
                let tHtml = '';
                uniqueNotices.slice(0, 10).forEach(n => {
                    tHtml += `<span class="ticker-item">🎯 <strong>NEW RESULT DECLARED:</strong> ${n.exam} by ${n.instName} (${n.state})</span>`;
                });
                let finalTHtml = tHtml + tHtml;
                if (tickerContent.innerHTML !== finalTHtml) tickerContent.innerHTML = finalTHtml;
            } else {
                tickerWrap.style.display = 'none';
            }
        }
    };
    window.renderPublicData();

});

window.addEventListener('igyr_data_updated', () => {
    console.log("Public View Auto-updating...");
    if(typeof window.renderPublicData === 'function') window.renderPublicData();
    if(typeof window.renderQuickLinks === 'function') window.renderQuickLinks();
    if(typeof window.renderSupportContact === 'function') window.renderSupportContact();
    if(typeof window.renderFrontPagePolicies === 'function') window.renderFrontPagePolicies();
});
