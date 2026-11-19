/**
 * IGYR Full-Screen Announcement Banner Engine
 * Dynamically displays official portal announcements, urgent examination updates,
 * and welcome messages configured by the Super Admin in the Admin Panel.
 */

(function () {
  'use strict';

  function getBannerApiBase() {
    if (window.location.protocol === 'file:') {
      return 'http://127.0.0.1:5005/api';
    }
    return '/api';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMessageBody(text) {
    if (!text) return '';
    const safe = escapeHtml(text);
    return safe
      .split('\n\n')
      .map(p => `<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  function closeBannerModal(modalEl, dismissKey) {
    if (!modalEl) return;
    if (dismissKey) {
      try {
        sessionStorage.setItem(dismissKey, '1');
      } catch (e) {}
    }
    modalEl.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
    modalEl.style.opacity = '0';
    modalEl.style.transform = 'scale(0.96)';
    setTimeout(() => {
      if (modalEl && modalEl.parentNode) {
        modalEl.parentNode.removeChild(modalEl);
      }
    }, 260);
  }

  function renderBannerModal(banner, isPreview = false) {
    const existing = document.getElementById('igyr-global-banner-overlay');
    if (existing) existing.remove();

    const isEnabled = banner && (banner.enabled === true || banner.enabled === 'true' || banner.enabled === 1 || banner.enabled === '1');
    if (!isEnabled && !isPreview) return;

    const dismissKey = isPreview ? null : ('igyr_banner_dismissed_' + (banner.updatedAt || 'active'));
    if (!isPreview && banner.showOncePerSession && sessionStorage.getItem(dismissKey)) {
      return; // Already acknowledged in this session
    }

    const badgeText = escapeHtml(banner.badge || '📢 OFFICIAL ANNOUNCEMENT');
    const titleText = escapeHtml(banner.title || 'Important Notice');
    const messageHtml = formatMessageBody(banner.message || '');

    const overlay = document.createElement('div');
    overlay.id = 'igyr-global-banner-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 18, 48, 0.86);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 99999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const card = document.createElement('div');
    card.id = 'igyr-global-banner-card';
    card.style.cssText = `
      position: relative;
      background: #ffffff;
      width: 100%;
      max-width: 600px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      border-radius: 20px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2);
      overflow: hidden;
      transform: scale(0.92) translateY(20px);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    card.innerHTML = `
      <!-- Top Decorative Official Header Bar -->
      <div style="background: linear-gradient(135deg, #071d49 0%, #0a3d8c 100%); padding: 18px 22px; position: relative; color: white;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(252, 227, 138, 0.18); border: 1px solid rgba(252, 227, 138, 0.4); padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #fce38a; letter-spacing: 0.5px; text-transform: uppercase;">
            ${badgeText}
          </div>
          <button id="igyr-banner-close-x" type="button" aria-label="Close" style="background: rgba(255, 255, 255, 0.18); border: none; width: 36px; height: 36px; border-radius: 50%; color: #ffffff; font-size: 20px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent;">
            ✕
          </button>
        </div>
        <h2 style="font-family: 'Poppins', sans-serif; font-size: 19px; font-weight: 700; color: #ffffff; margin: 12px 0 0 0; line-height: 1.35;">
          ${titleText}
        </h2>
      </div>

      <!-- Banner Body Content -->
      <div style="padding: 24px 22px; overflow-y: auto; -webkit-overflow-scrolling: touch; flex: 1; color: #334155; font-size: 14px; line-height: 1.65; max-height: 52vh;">
        ${messageHtml}
      </div>

      <!-- Bottom Action Controls -->
      <div style="padding: 16px 22px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: flex-end;">
        <button id="igyr-banner-dismiss-btn" type="button" style="background: linear-gradient(135deg, #1266d6 0%, #062b63 100%); color: #ffffff; font-weight: 700; font-size: 13px; padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(18, 102, 214, 0.35);">
          Continue to Portal ✕
        </button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      card.style.transform = 'scale(1) translateY(0)';
    });

    // Event Listeners
    const closeBtn = card.querySelector('#igyr-banner-close-x');
    const dismissBtn = card.querySelector('#igyr-banner-dismiss-btn');

    const handleDismiss = (e) => {
      if (e) e.preventDefault();
      closeBannerModal(overlay, dismissKey);
    };

    if (closeBtn) closeBtn.onclick = handleDismiss;
    if (dismissBtn) dismissBtn.onclick = handleDismiss;

    // Close when clicking outside card
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        handleDismiss();
      }
    });

    // Close on Escape key
    const escListener = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);
  }

  async function initAnnouncementBanner() {
    try {
      const apiBase = getBannerApiBase();
      // Added cache-buster ?_t= to guarantee fresh load on mobile networks
      const res = await fetch(apiBase + '/banner?_t=' + Date.now());
      if (!res.ok) return;
      const banner = await res.json();
      if (banner && (banner.enabled === true || banner.enabled === 'true' || banner.enabled === 1 || banner.enabled === '1')) {
        renderBannerModal(banner, false);
      }
    } catch (err) {
      console.warn('[IGYR Banner] Could not load announcement banner:', err);
    }
  }

  // Expose global preview trigger for Admin Panel
  window.showIgyrBannerPreview = function (customData) {
    renderBannerModal(customData || {
      enabled: true,
      badge: "📢 LIVE PREVIEW",
      title: "Sample Announcement Banner",
      message: "This is a real-time preview of how students and visitors will see this announcement across mobile devices and computers.",
      buttonText: "Sample Button →",
      buttonUrl: "#"
    }, true);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnouncementBanner);
  } else {
    initAnnouncementBanner();
  }
})();
