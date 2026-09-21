/* GA4 enhanced event tracking (capture phase, beacon transport) */
(function() {
    'use strict';

    function track(event, params) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', event, params);
        }
    }

    function trackAndNavigate(event, params, url) {
        try {
            if (typeof window.gtag === 'function') {
                params.transport_type = 'beacon';
                window.gtag('event', event, params);
            }
        } catch (e) {
            // Analytics failure must never block navigation
        }
        setTimeout(function() { window.location.href = url; }, 150);
    }

    document.addEventListener('DOMContentLoaded', function() {

        // Downloads
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.js--delayed-download, .js--thanks, .download');
            if (!btn) return;

            track('download_click', {
                platform: btn.dataset.platform || '',
                product: btn.dataset.product || '',
                url: btn.dataset.url || btn.href || ''
            });
        }, true);

        // Store clicks
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.js--mobile-store-btn, .js--mobile-store-external');
            if (!btn) return;

            track('store_click', {
                platform: btn.dataset.platform || '',
                url: btn.dataset.storeUrl || btn.href || ''
            });
        }, true);

        // Outbound links
        document.addEventListener('click', function(e) {
            var a, href;
            try {
                a = e.target.closest('a[href]');
            } catch (err) { return; }
            if (!a) return;
            href = a.href;
            if (!href || href.indexOf(location.hostname) !== -1 || href.indexOf('http') !== 0) return;

            var params = {
                url: href,
                link_text: (a.textContent || '').trim().substring(0, 100)
            };

            if (a.target === '_blank') {
                track('outbound_click', params);
                return;
            }

            e.preventDefault();
            trackAndNavigate('outbound_click', params, href);
        }, true);

        // Language switcher
        document.addEventListener('click', function(e) {
            var item = e.target.closest('.dropdown-item[href], .language-modal-item[href]');
            if (!item) return;
            var inLangDropdown = item.closest('.dropdown-menu') && item.closest('.dropdown-menu').previousElementSibling && item.closest('.dropdown-menu').previousElementSibling.classList.contains('lang-toggle');
            var inLangModal = item.classList.contains('language-modal-item');
            if (!inLangDropdown && !inLangModal) return;

            var href = item.getAttribute('href') || '';
            var match = href.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(\/|$)/);
            if (match) {
                track('language_switch', { language: match[1] });
            }
        }, true);
    });

    // Expose for programmatic external redirects (store buttons, etc.)
    window.trackAndNavigate = trackAndNavigate;

    // Consent choice tracking — uses dataLayer.push() instead of gtag() directly
    // because at consent time the GA script may not be loaded yet (page reloads after consent)
    window.trackConsentChoice = function(action, categories) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'consent_choice',
            'action': action,
            'categories': (categories || []).join(',')
        });
    };

    // Cookiebot consent event
    window.addEventListener('CookiebotOnAccept', function() {
        if (typeof Cookiebot === 'undefined' || !Cookiebot.consent) return;
        var cats = ['necessary'];
        if (Cookiebot.consent.preferences) cats.push('preferences');
        if (Cookiebot.consent.statistics) cats.push('statistics');
        if (Cookiebot.consent.marketing) cats.push('marketing');
        var action = cats.length <= 1 ? 'reject_all' : cats.length >= 4 ? 'accept_all' : 'custom';
        window.trackConsentChoice(action, cats);
    });
})();
