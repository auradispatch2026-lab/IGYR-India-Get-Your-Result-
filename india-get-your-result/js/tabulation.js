
document.addEventListener('DOMContentLoaded', () => {
    const instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
    const examSelect = document.getElementById('tab-exam-select');
    const btnView = document.getElementById('btn-view-tab');
    const container = document.getElementById('tabulation-container');
    
    // Get all results for this institute
    const allResults = getResults().filter(r => r.instId === instId);
    
    // Find unique exams
    const exams = [...new Set(allResults.map(r => r.exam))];
    
    if(exams.length === 0) {
        examSelect.innerHTML = '<option value="">No Exams Published Yet</option>';
        btnView.disabled = true;
    } else {
        exams.forEach(ex => {
            let opt = document.createElement('option');
            opt.value = ex;
            opt.textContent = ex;
            examSelect.appendChild(opt);
        });
    }
    
    btnView.addEventListener('click', () => {
        const examName = examSelect.value;
        if(!examName) {
            alert('Please select an exam first.');
            return;
        }
        
        const examData = allResults.filter(r => r.exam === examName);
        if(examData.length === 0) return;
        
        // Extract all unique subjects to form table headers
        let subjectsMap = new Set();
        examData.forEach(row => {
            row.marks.forEach(m => subjectsMap.add(m.sub));
        });
        const subjects = Array.from(subjectsMap);
        
        const inst = getInstitutes().find(i => i.id === instId);
        
        let html = `
            <div style="text-align:center; margin-bottom: 20px; background:#f1f2f6; padding:15px; border-radius:8px;">
                <h2 style="color:var(--primary); margin:0;">TABULATION REGISTER</h2>
                <h3 style="margin:5px 0;">Exam: ${examName}</h3>
                <p style="color:#555; margin:0;">${inst ? inst.name : ''} | Date: ${examData[0].date || 'N/A'}</p>
            </div>
            <table class="table" style="width:100%; text-align:center; border-collapse: collapse; min-width:800px;">
                <thead>
                    <tr style="background-color:#0b1e42; color:#fff;">
                        <th style="padding:10px; border:1px solid #ccc;">Sl. No.</th>
                        <th style="padding:10px; border:1px solid #ccc; text-align:left;">Registration No</th>
                        <th style="padding:10px; border:1px solid #ccc; text-align:left;">Roll No</th>
                        <th style="padding:10px; border:1px solid #ccc; text-align:left;">Student Name</th>
        `;
        
        subjects.forEach(sub => {
            html += `<th style="padding:10px; border:1px solid #ccc;">${sub}</th>`;
        });
        
        html += `<th style="padding:10px; border:1px solid #ccc;">Total</th>
                 <th style="padding:10px; border:1px solid #ccc;">Percentage</th>
                 <th style="padding:10px; border:1px solid #ccc;">Result</th>
                 </tr></thead><tbody>`;
                 
        examData.forEach((row, idx) => {
            let rowTotal = 0;
            let rowMax = subjects.length * 100;
            
            // pre-map student's marks for easy lookup
            let markMap = {};
            row.marks.forEach(m => { markMap[m.sub] = parseInt(m.obt) || 0; });
            
            let subsHtml = '';
            let failed = false;
            subjects.forEach(sub => {
                let m = markMap[sub] !== undefined ? markMap[sub] : '-';
                if(m !== '-' && m < 33) failed = true; // basic pass logic
                if(m !== '-') rowTotal += m;
                subsHtml += `<td style="padding:10px; border:1px solid #ccc;">${m}</td>`;
            });
            
            let percentage = rowMax > 0 ? ((rowTotal / rowMax) * 100).toFixed(2) + '%' : '0%';
            let resultStatus = failed ? '<span style="color:red; font-weight:bold;">FAIL</span>' : '<span style="color:green; font-weight:bold;">PASS</span>';
            
            html += `<tr>
                <td style="padding:10px; border:1px solid #ccc;">${idx + 1}</td>
                <td style="padding:10px; border:1px solid #ccc; text-align:left;">${row.reg}</td>
                <td style="padding:10px; border:1px solid #ccc; text-align:left;">${row.roll}</td>
                <td style="padding:10px; border:1px solid #ccc; text-align:left; font-weight:bold;">${row.name}</td>
                ${subsHtml}
                <td style="padding:10px; border:1px solid #ccc; font-weight:bold;">${rowTotal}</td>
                <td style="padding:10px; border:1px solid #ccc;">${percentage}</td>
                <td style="padding:10px; border:1px solid #ccc;">${resultStatus}</td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    });
});
