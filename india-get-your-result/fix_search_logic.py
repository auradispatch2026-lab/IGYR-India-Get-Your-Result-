import os

base = "/Users/arnnavpanda/Desktop/Resultweb/india-get-your-result"
js_path = os.path.join(base, "js/public.js")

with open(js_path, "r") as f:
    js = f.read()

injection = """
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

"""

js = js.replace("    // Render Quick Links", injection + "    // Render Quick Links")

with open(js_path, "w") as f:
    f.write(js)
print("Restored missing search logic!")
