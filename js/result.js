
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
