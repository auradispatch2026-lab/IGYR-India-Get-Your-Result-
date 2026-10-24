/**
 * IGYR - India Get Your Result
 * PWA Install Manager & Service Worker Registration
 */

(function() {
    let deferredInstallPrompt = null;

    // Check if already running as an installed standalone PWA app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;

    if (isStandalone) {
        console.log("IGYR: Already running in standalone installed app mode.");
        return;
    }

    // 1. Register Service Worker for PWA compliance & offline caching
    if ('serviceWorker' in navigator) {
        const registerSw = () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(reg => {
                    console.log('IGYR Service Worker registered, scope:', reg.scope);
                })
                .catch(err => {
                    console.warn('IGYR Service Worker registration failed:', err);
                });
        };

        if (document.readyState === 'complete') {
            registerSw();
        } else {
            window.addEventListener('load', registerSw);
        }
    }

    // 2. Inject PWA UI Styles
    function injectPwaStyles() {
        if (document.getElementById('igyr-pwa-styles')) return;
        const style = document.createElement('style');
        style.id = 'igyr-pwa-styles';
        style.textContent = `
            /* PWA Nav Install Button */
            .nav-install-btn {
                display: inline-flex !important;
                align-items: center !important;
                gap: 8px !important;
                background: linear-gradient(135deg, #f5b82e, #e29f0e) !important;
                color: #071d49 !important;
                font-family: inherit !important;
                font-weight: 700 !important;
                font-size: 14px !important;
                padding: 8px 18px !important;
                border-radius: 50px !important;
                border: none !important;
                cursor: pointer !important;
                box-shadow: 0 4px 12px rgba(245, 184, 46, 0.35) !important;
                transition: transform 0.2s, box-shadow 0.2s, background 0.2s !important;
                text-decoration: none !important;
                white-space: nowrap !important;
                margin-left: 10px;
                vertical-align: middle;
            }
            .nav-install-btn:hover {
                transform: translateY(-2px) scale(1.02) !important;
                box-shadow: 0 6px 18px rgba(245, 184, 46, 0.5) !important;
                background: linear-gradient(135deg, #f7c34b, #e09908) !important;
            }
            .nav-install-btn svg {
                width: 17px;
                height: 17px;
                fill: currentColor;
                flex-shrink: 0;
            }

            /* Floating Install Banner for Mobile & Desktop */
            .igyr-pwa-floating {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 99999;
                display: flex;
                align-items: center;
                gap: 12px;
                background: #071d49;
                color: #ffffff;
                padding: 12px 18px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(7, 29, 73, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15);
                font-family: 'Inter', -apple-system, sans-serif;
                animation: igyrPwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes igyrPwaSlideUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .igyr-pwa-logo {
                width: 42px;
                height: 42px;
                border-radius: 10px;
                object-fit: cover;
                background: white;
            }
            .igyr-pwa-info {
                display: flex;
                flex-direction: column;
                text-align: left;
            }
            .igyr-pwa-title {
                font-size: 14px;
                font-weight: 700;
                color: #ffffff;
                margin: 0;
            }
            .igyr-pwa-sub {
                font-size: 12px;
                color: #94a3b8;
                margin: 0;
            }
            .igyr-pwa-action {
                background: #f5b82e;
                color: #071d49;
                font-size: 13px;
                font-weight: 700;
                padding: 8px 16px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                transition: transform 0.15s, background 0.15s;
                white-space: nowrap;
            }
            .igyr-pwa-action:hover {
                background: #e29f0e;
                transform: scale(1.04);
            }
            .igyr-pwa-close {
                background: transparent;
                border: none;
                color: #94a3b8;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                margin-left: -4px;
            }
            .igyr-pwa-close:hover {
                color: #ffffff;
            }

            @media (max-width: 768px) {
                .igyr-pwa-floating {
                    left: 14px;
                    right: 14px;
                    bottom: 16px;
                    padding: 10px 14px;
                }
                .nav-install-btn {
                    margin: 10px 0;
                    width: 100%;
                    justify-content: center;
                }
            }

            /* Modal for iOS & Help */
            .igyr-pwa-modal-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.65);
                backdrop-filter: blur(4px);
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: igyrPwaFadeIn 0.2s ease-out;
            }
            @keyframes igyrPwaFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .igyr-pwa-modal {
                background: #ffffff;
                color: #071d49;
                max-width: 440px;
                width: 100%;
                border-radius: 20px;
                padding: 28px 24px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.25);
                position: relative;
                text-align: center;
                font-family: 'Inter', -apple-system, sans-serif;
            }
            .igyr-pwa-modal h3 {
                margin: 12px 0 8px;
                font-size: 20px;
                font-weight: 800;
                color: #071d49;
            }
            .igyr-pwa-modal p {
                font-size: 14px;
                color: #475569;
                line-height: 1.6;
                margin: 0 0 20px;
            }
            .igyr-pwa-steps {
                background: #f1f5f9;
                border-radius: 12px;
                padding: 16px;
                text-align: left;
                font-size: 14px;
                color: #1e293b;
                margin-bottom: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .igyr-pwa-step-item {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .igyr-pwa-step-num {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                background: #1266d6;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 13px;
                flex-shrink: 0;
            }
            .igyr-pwa-modal-btn {
                background: #1266d6;
                color: white;
                border: none;
                font-size: 15px;
                font-weight: 700;
                padding: 12px 28px;
                border-radius: 10px;
                cursor: pointer;
                width: 100%;
                transition: background 0.2s;
            }
            .igyr-pwa-modal-btn:hover {
                background: #0b4cb0;
            }
        `;
        document.head.appendChild(style);
    }

    // 3. Capture beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        console.log("IGYR: beforeinstallprompt captured! Custom install button is ready.");
        showInstallUi();
    });

    // 4. Trigger Installation Prompt
    window.triggerPwaInstall = async function() {
        if (deferredInstallPrompt) {
            try {
                deferredInstallPrompt.prompt();
                const { outcome } = await deferredInstallPrompt.userChoice;
                console.log("User install prompt choice:", outcome);
                if (outcome === 'accepted') {
                    hideInstallUi();
                }
            } catch (err) {
                console.error("Install prompt error:", err);
            }
            deferredInstallPrompt = null;
            return;
        }

        // If on iOS Safari
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIos) {
            showIosInstallModal();
            return;
        }

        // Fallback for Android / Desktop Chrome when prompt cooldown or manual install
        showGeneralInstallModal();
    };

    function showIosInstallModal() {
        const existing = document.querySelector('.igyr-pwa-modal-overlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'igyr-pwa-modal-overlay';
        modal.innerHTML = `
            <div class="igyr-pwa-modal">
                <img src="/favicon.png" alt="IGYR" class="igyr-pwa-logo" style="width:54px; height:54px; margin:0 auto;">
                <h3>Install IGYR on iPhone / iPad</h3>
                <p>Install India Get Your Result to your home screen for quick one-tap result access.</p>
                <div class="igyr-pwa-steps">
                    <div class="igyr-pwa-step-item">
                        <div class="igyr-pwa-step-num">1</div>
                        <div>Tap the <strong>Share</strong> button (<span style="font-size:18px;">⎋</span> or <span style="font-size:18px;">⤤</span>) in Safari.</div>
                    </div>
                    <div class="igyr-pwa-step-item">
                        <div class="igyr-pwa-step-num">2</div>
                        <div>Scroll down and tap <strong>"Add to Home Screen" ⊕</strong>.</div>
                    </div>
                    <div class="igyr-pwa-step-item">
                        <div class="igyr-pwa-step-num">3</div>
                        <div>Tap <strong>Add</strong> in the top right corner.</div>
                    </div>
                </div>
                <button class="igyr-pwa-modal-btn" onclick="this.closest('.igyr-pwa-modal-overlay').remove()">Got It</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function showGeneralInstallModal() {
        const existing = document.querySelector('.igyr-pwa-modal-overlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'igyr-pwa-modal-overlay';
        modal.innerHTML = `
            <div class="igyr-pwa-modal">
                <img src="/favicon.png" alt="IGYR" class="igyr-pwa-logo" style="width:54px; height:54px; margin:0 auto;">
                <h3>Install IGYR App</h3>
                <p>Fast, direct access to examination results and verified credentials.</p>
                <div class="igyr-pwa-steps">
                    <div class="igyr-pwa-step-item">
                        <div class="igyr-pwa-step-num">1</div>
                        <div>Tap your browser's <strong>menu (⋮ or ⋯)</strong> at the top or bottom right.</div>
                    </div>
                    <div class="igyr-pwa-step-item">
                        <div class="igyr-pwa-step-num">2</div>
                        <div>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</div>
                    </div>
                </div>
                <button class="igyr-pwa-modal-btn" onclick="this.closest('.igyr-pwa-modal-overlay').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function showInstallUi() {
        injectPwaStyles();

        // 1. Ensure Navbar Button exists and has active click handler
        const navLinks = document.getElementById('navLinks');
        let navBtn = document.getElementById('nav-install-btn');
        if (!navBtn && navLinks) {
            navBtn = document.createElement('button');
            navBtn.id = 'nav-install-btn';
            navBtn.className = 'nav-install-btn';
            navBtn.innerHTML = `
                <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
                Install App
            `;
            navLinks.appendChild(navBtn);
        }

        if (navBtn) {
            navBtn.onclick = (e) => {
                if (e) e.preventDefault();
                window.triggerPwaInstall();
            };
        }

        // 2. Floating Bottom Install Banner
        if (!document.getElementById('igyr-pwa-banner') && !sessionStorage.getItem('igyr_pwa_dismissed')) {
            const banner = document.createElement('div');
            banner.id = 'igyr-pwa-banner';
            banner.className = 'igyr-pwa-floating';
            banner.innerHTML = `
                <img src="/favicon.png" alt="IGYR" class="igyr-pwa-logo">
                <div class="igyr-pwa-info">
                    <span class="igyr-pwa-title">Install IGYR App</span>
                    <span class="igyr-pwa-sub">Instant results on your home screen</span>
                </div>
                <button class="igyr-pwa-action" id="igyr-pwa-action-btn">Install</button>
                <button class="igyr-pwa-close" id="igyr-pwa-close-btn" title="Dismiss">✕</button>
            `;

            document.body.appendChild(banner);

            const actionBtn = document.getElementById('igyr-pwa-action-btn');
            if (actionBtn) {
                actionBtn.addEventListener('click', () => {
                    window.triggerPwaInstall();
                });
            }

            const closeBtn = document.getElementById('igyr-pwa-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    banner.remove();
                    sessionStorage.setItem('igyr_pwa_dismissed', 'true');
                });
            }
        }
    }

    function hideInstallUi() {
        const banner = document.getElementById('igyr-pwa-banner');
        if (banner) banner.remove();
        const navBtn = document.getElementById('nav-install-btn');
        if (navBtn) navBtn.style.display = 'none';
    }

    // App installed event listener
    window.addEventListener('appinstalled', () => {
        console.log('IGYR App was successfully installed!');
        hideInstallUi();
    });

    // Initialize immediately without waiting if DOM is already ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showInstallUi);
    } else {
        showInstallUi();
    }
})();
