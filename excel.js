
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('excel-file');
    const processBtn = document.getElementById('btn-process');
    const publishBtn = document.getElementById('btn-publish');
    const previewArea = document.getElementById('preview-area');
    const btnGenerateTemplate = document.getElementById('btn-generate-template');
    let parsedData = [];

    // Display institute address
    const instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
    const inst = getInstitutes().find(i => i.id === instId);
    const addrDisplay = document.getElementById('inst-address-display');
    if (addrDisplay) {
        addrDisplay.textContent = inst ? `${inst.city ? inst.city+', ' : ''}${inst.district || ''}, ${inst.state || ''} ${inst.pin ? '- '+inst.pin : ''}` : 'Address not found';
    }


    if (btnGenerateTemplate) {
        btnGenerateTemplate.addEventListener('click', () => {
            const subjectsStr = document.getElementById('subject-names').value;
            if (!subjectsStr.trim()) {
                alert('Please enter at least one subject.');
                return;
            }
            
            const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s);
            const headers = ['Reg', 'Roll', 'Name', 'Father Name', 'Mother Name', ...subjects];
            
            const demoData = [
                headers,
                ['REG2001', 'ROL2001', 'Alice Smith', 'John Smith', 'Mary Smith', ...subjects.map(() => Math.floor(Math.random() * 41) + 60)],
                ['REG2002', 'ROL2002', 'Bob Jones', 'David Jones', 'Sarah Jones', ...subjects.map(() => Math.floor(Math.random() * 41) + 60)],
                ['REG2003', 'ROL2003', 'Charlie Brown', 'James Brown', 'Emma Brown', ...subjects.map(() => Math.floor(Math.random() * 41) + 60)]
            ];
            
            const ws = XLSX.utils.aoa_to_sheet(demoData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");
            
            const instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
            XLSX.writeFile(wb, `${instId}_Sample_Template.xlsx`);
        });
    }

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
                
                const examName = document.getElementById('exam-name') ? document.getElementById('exam-name').value.trim() : 'Unknown Exam';
                
                let html = `<div style="text-align:center; margin-bottom: 15px; background: #f0f8ff; padding: 10px; border-radius: 5px;">
                                <h3 style="margin:0; color:var(--primary);">Preview: ${examName || '(No Exam Name Entered)'}</h3>
                            </div>`;
                html += '<table class="table"><thead><tr>';
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
            const examName = document.getElementById('exam-name') ? document.getElementById('exam-name').value.trim() : 'Uploaded Exam';
            const resultDate = document.getElementById('result-date') ? document.getElementById('result-date').value : '';
            
            if (!examName || !resultDate) {
                alert("Please enter the Name of Exam and Result Date before publishing.");
                return;
            }
            
            const instId = sessionStorage.getItem('inst_logged_in') || 'IGYR001';
            const results = getResults();
            parsedData.forEach(row => {
                let m = [];
                let fKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z]/g, '').includes('father'));
                let mKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z]/g, '').includes('mother'));
                let rKey = Object.keys(row).find(k => k.toLowerCase().includes('reg'));
                let roKey = Object.keys(row).find(k => k.toLowerCase().includes('roll'));
                let nKey = Object.keys(row).find(k => k.toLowerCase() === 'name' || k.toLowerCase() === 'student name');
                
                Object.keys(row).forEach(k => {
                    if (k !== rKey && k !== roKey && k !== nKey && k !== fKey && k !== mKey) {
                        m.push({sub: k, max: 100, obt: row[k]});
                    }
                });

                let fatherKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z]/g, '').includes('father'));
                let motherKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z]/g, '').includes('mother'));
                let regKey = Object.keys(row).find(k => k.toLowerCase().includes('reg'));
                let rollKey = Object.keys(row).find(k => k.toLowerCase().includes('roll'));
                let nameKey = Object.keys(row).find(k => k.toLowerCase() === 'name' || k.toLowerCase() === 'student name');

                results.push({
                    reg: row[regKey] || 'N/A',
                    roll: row[rollKey] || 'N/A',
                    name: row[nameKey] || 'N/A',
                    fname: fatherKey ? row[fatherKey] : 'N/A',
                    mname: motherKey ? row[motherKey] : 'N/A',
                    instId: instId,
                    exam: examName,
                    date: resultDate,
                    class: 'N/A',
                    marks: m,
                    vid: 'IGYR-' + Math.floor(Math.random()*1000000),
                    status: 'DRAFT'
                });
            });
            saveResults(results);
            alert(`Results for ${examName} saved as DRAFT successfully!\n\nYou can publish it from the Dashboard when ready.`);
            window.location.href = 'institute-dashboard.html';
        });
    }
});
