/**
 * ORA Najd Landing Page — Script
 * Author: propertiesegy
 * Date: 2026-08-12
 */

document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    initScrollReveal();
    initGalleries();
    initFormHandling();
    initWhatsAppTracking();
});

/* ==========================================================================
   Scroll Reveal Animations
   ========================================================================== */
function initScrollReveal() {
    const elements = document.querySelectorAll('.animate-reveal');
    const triggerBottom = window.innerHeight * 0.88;

    function revealOnScroll() {
        elements.forEach(el => {
            if (el.getBoundingClientRect().top < triggerBottom) {
                el.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', revealOnScroll, { passive: true });
    revealOnScroll(); // Run once on load
}

/* ==========================================================================
   Gallery Carousels
   ========================================================================== */
const galleries = {
    ss: { index: 0, total: 4 },
    ze: { index: 0, total: 4 },
    zw: { index: 0, total: 5 },
};

function getVisible() {
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640)  return 2;
    return 1;
}

function updateGallery(id) {
    const g = galleries[id];
    const track = document.getElementById(id + '-t');
    if (!track) return;

    const v   = getVisible();
    const sw  = 100 / v;
    const max = Math.max(0, g.total - v);

    g.index = Math.min(g.index, max);

    track.querySelectorAll('.gal-slide').forEach(s => {
        s.style.minWidth = sw + '%';
    });
    track.style.transform = `translateX(-${g.index * sw}%)`;
}

function galleryPrev(id) {
    galleries[id].index = Math.max(0, galleries[id].index - 1);
    updateGallery(id);
}

function galleryNext(id) {
    const max = Math.max(0, galleries[id].total - getVisible());
    galleries[id].index = Math.min(max, galleries[id].index + 1);
    updateGallery(id);
}

// Make functions accessible from inline onclick attributes
window.galleryPrev = galleryPrev;
window.galleryNext = galleryNext;

function initGalleries() {
    ['ss', 'ze', 'zw'].forEach(id => {
        updateGallery(id);

        // Touch swipe support
        const track = document.getElementById(id + '-t');
        if (!track) return;

        let startX = 0;
        track.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                diff > 0 ? galleryNext(id) : galleryPrev(id);
            }
        });
    });

    window.addEventListener('resize', () => {
        ['ss', 'ze', 'zw'].forEach(updateGallery);
    });
}

/* ==========================================================================
   Toast Notification
   ========================================================================== */
function showToast(title, msg, duration = 4500) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-msg').textContent   = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

/* ==========================================================================
   Modal
   ========================================================================== */
function openModal() {
    const modal = document.getElementById('success-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
}

// Close modal on backdrop click
window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });
    }
});

window.closeModal = closeModal;

/* ==========================================================================
   Form Handling & Validation (via Web3Forms)
   ========================================================================== */
function initFormHandling() {
    const leadForm  = document.getElementById('lead-form');
    const submitBtn = document.getElementById('submit-btn');
    const spinner   = document.getElementById('form-spinner');

    if (!leadForm) return;

    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput  = document.getElementById('name');
        const phoneInput = document.getElementById('phone');

        // --- Validate required fields ---
        if (!nameInput.value.trim() || !phoneInput.value.trim()) {
            showToast('Required fields', 'Please fill in all fields before submitting.', 3500);
            return;
        }

        // --- Normalize Egyptian phone number ---
        let cleanPhone = phoneInput.value.trim().replace(/[\s\-\(\)]/g, '');
        if (cleanPhone.startsWith('+20'))       { /* already formatted */ }
        else if (cleanPhone.startsWith('0020')) { cleanPhone = '+' + cleanPhone.slice(2); }
        else if (cleanPhone.startsWith('20'))   { cleanPhone = '+' + cleanPhone; }
        else if (cleanPhone.startsWith('01'))   { cleanPhone = '+20' + cleanPhone.slice(1); }
        else if (cleanPhone.startsWith('1'))    { cleanPhone = '+20' + cleanPhone; }
        else {
            showToast('Invalid number', 'Please enter a valid Egyptian mobile number (e.g. 01xxxxxxxxx).', 3500);
            phoneInput.focus();
            return;
        }

        const egPhoneRegex = /^\+201[0125][0-9]{8}$/;
        if (!egPhoneRegex.test(cleanPhone)) {
            showToast('Invalid number', 'Please enter a valid Egyptian mobile number (e.g. 01xxxxxxxxx).', 3500);
            phoneInput.focus();
            return;
        }

        // --- Update phone field with normalized value ---
        phoneInput.value = cleanPhone;

        // --- Show loading state ---
        submitBtn.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';

        // --- Submit via Web3Forms ---
        const accessKey = document.getElementById('web3forms-key')?.value?.trim();
        if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
            // Test mode: log to console
            console.log('%c[ORA Lead — Test Mode]', 'color:#c9aa71;font-weight:bold;font-size:14px');
            console.log('Lead:', { name: nameInput.value, phone: cleanPhone });
            console.log('Register a free key at https://web3forms.com and paste it in index.html');
            setTimeout(() => { resetForm(); openModal(); }, 1000);
            return;
        }

        try {
            const formData = new FormData(leadForm);
            formData.set('phone', cleanPhone);

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                // Fire Google Ads conversion tracking for form submission
                if (typeof gtag_report_conversion === 'function') {
                    gtag_report_conversion();
                }
                resetForm();
                openModal();
            } else {
                console.error('Web3Forms error:', result);
                showToast('Submission error', result.message || 'Please try again.', 4000);
                resetButton();
            }
        } catch (err) {
            console.error('Fetch error:', err);
            showToast('Network error', 'Please check your connection and try again.', 4000);
            resetButton();
        }
    });

    function resetForm() {
        leadForm.reset();
        resetButton();
    }

    function resetButton() {
        submitBtn.disabled = false;
        if (spinner) spinner.style.display = 'none';
    }
}

/* ==========================================================================
   WhatsApp Click Tracking (Google Ads Conversion)
   ========================================================================== */
function initWhatsAppTracking() {
    const waLinks = document.querySelectorAll('a[href*="wa.me"]');
    waLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (typeof gtag === 'function') {
                gtag('event', 'conversion', {
                    'send_to': 'AW-299139259/IttmCOi8ieIcELuB0o4B',
                    'value': 1.0,
                    'currency': 'EGP'
                });
            }
        });
    });
}

