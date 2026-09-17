
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

    // Render Quick Links
    window.renderQuickLinks = function() {
        const qlContainer = document.getElementById('quick-links-container');
        if (qlContainer) {
            let links = [];
            links = typeof getQuickLinks === "function" ? getQuickLinks() : [];
            if(links.length > 0) {
                qlContainer.innerHTML = '';
                links.forEach(l => {
                    qlContainer.innerHTML += `<a href="${l.url}">${l.text}</a>`;
                });
            }
        }
    };
    window.renderQuickLinks();

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
});
