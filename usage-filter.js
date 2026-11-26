// ========== USAGE FILTER (Umami Cloud, anonymous page-view counting) ==========
// index.html, privacy.html and 404.html run this file as a plain script (no async, no defer) on
// the line right before the async Umami tag, at the absolute address /usage-filter.js so the 404
// page finds it at any depth. The parser inserts the tracker only after this script has run, so
// filterSitePayload already exists before the tracker can send anything, the first automatic
// page view included. The same pattern runs on Marko (md-he/usage-filter.js).
// The tag itself already drops the query string and the hash (data-exclude-search,
// data-exclude-hash), honours Do Not Track (data-do-not-track) and sends no cookies. This filter
// is the second net: it checks every send again and sends nothing it does not recognise.

// Only page views are counted. This list of events is empty, so every named event is refused.
// An event Ben asks for goes in here by name, starting with "site-", with a fixed list of values
// for each of its properties, e.g. 'site-contact-open': { channel: ['whatsapp', 'mail', 'phone'] }.
const ALLOWED_SITE_EVENTS = {};

// True when `name` is a listed event and every property of `data` has a listed value.
function isAllowedSiteEvent(name, data) {
    if (typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(ALLOWED_SITE_EVENTS, name)) return false;
    if (data === undefined || data === null) return true;
    if (typeof data !== 'object') return false;
    const allowed = ALLOWED_SITE_EVENTS[name];
    return Object.keys(data).every((key) =>
        Object.prototype.hasOwnProperty.call(allowed, key) && allowed[key].includes(data[key]));
}

// Named by the Umami tag's data-before-send: the tracker calls it before every send and sends
// nothing when it returns a falsy value. Page views and events both arrive as type 'event'; the
// tracker's other types ('identify', 'performance', 'error') never leave. It must never throw.
function filterSitePayload(type, payload) {
    try {
        if (type !== 'event' || !payload || typeof payload !== 'object') return false;
        // No identifier of any kind: the tag sets none, and a payload that carries one is dropped.
        if (payload.id !== undefined || payload.salt !== undefined) return false;
        if (typeof payload.url !== 'string' || /[?#]/.test(payload.url)) return false;
        // Only the referring site's origin leaves: never its path, query, hash or login.
        // A same-site referrer (the tracker turns it into a bare path) is dropped as well.
        let referrerOrigin = '';
        if (typeof payload.referrer === 'string' && /^https?:\/\//i.test(payload.referrer)) {
            try {
                const referrerUrl = new URL(payload.referrer);
                if (referrerUrl.protocol === 'http:' || referrerUrl.protocol === 'https:') {
                    referrerOrigin = referrerUrl.origin;
                }
            } catch (err) { referrerOrigin = ''; }
        }
        if (referrerOrigin) {
            payload.referrer = referrerOrigin;
        } else {
            delete payload.referrer;
        }
        if (payload.name === undefined) return payload;
        return isAllowedSiteEvent(payload.name, payload.data) ? payload : false;
    } catch (err) {
        return false;
    }
}
