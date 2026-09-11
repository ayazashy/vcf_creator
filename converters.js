/**
 * converters.js
 * Serializers and parsers for contacts in VCF (vCard 2.1, 3.0 & 4.0),
 * Google Contacts CSV, Outlook CSV, Standard CSV/TSV, and JSON.
 *
 * Arabic & Non-ASCII Support:
 * - Supports Quoted-Printable encoding (=D9=8A...) with CHARSET=UTF-8 for legacy devices & Outlook
 * - Supports direct UTF-8 for modern iOS / Android / Google Contacts
 * - Supports automatic Quoted-Printable decoding when importing .vcf files
 * - Supports UTF-8 BOM (\uFEFF) for Excel CSV compatibility with Arabic text
 *
 * Strict Rule: When exporting, empty fields and empty contacts are never emitted.
 */

import { getLocalizedColumns } from './i18n.js';

export { getLocalizedColumns };
export const DEFAULT_COLUMNS = getLocalizedColumns('ar');

/**
 * Checks whether a string contains non-ASCII characters (Arabic, Cyrillic, accented letters, etc.).
 */
export function hasNonAscii(str = '') {
  return /[^\x00-\x7F]/.test(String(str));
}

/**
 * Encodes a string into UTF-8 Quoted-Printable format.
 * Converts Arabic and non-ASCII characters into '=XX' hex bytes (e.g. Arabic 'ي' -> '=D9=8A').
 */
export function toQuotedPrintable(str = '') {
  if (!str) return '';
  const encoder = new TextEncoder();
  const bytes = encoder.encode(String(str));
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Encode non-ASCII (byte >= 128), '=', and ';' (to protect vCard property component separators)
    if (byte >= 128 || byte === 61 || byte === 59) {
      result += '=' + byte.toString(16).toUpperCase().padStart(2, '0');
    } else {
      result += String.fromCharCode(byte);
    }
  }
  return result;
}

/**
 * Decodes a Quoted-Printable string with UTF-8 byte sequences back to human-readable text.
 * Automatically handles soft line breaks (=\r?\n) and decodes '=D9=8A...' back to Arabic letters.
 */
export function decodeQuotedPrintable(qpStr = '') {
  if (!qpStr) return '';
  // Remove soft line breaks: =\r\n or =\n
  const cleanStr = String(qpStr).replace(/=(\r?\n)/g, '');
  const bytes = [];
  for (let i = 0; i < cleanStr.length; i++) {
    if (cleanStr[i] === '=' && i + 2 < cleanStr.length && /[0-9A-Fa-f]{2}/.test(cleanStr.slice(i + 1, i + 3))) {
      const hex = cleanStr.slice(i + 1, i + 3);
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(cleanStr.charCodeAt(i));
    }
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

/**
 * Standardizes Saudi phone numbers into standard +966 format.
 * - Mobile: 05XXXXXXXX, 5XXXXXXXX, +9665... -> +9665XXXXXXXX
 * - Landline (Telephone): 011XXXXXXX, 11XXXXXXX -> +96611XXXXXXX
 *   012 (Makkah/Jeddah), 013 (Eastern), 014 (Madinah/Tabuk), 016 (Qassim), 017 (South) -> +9661X...
 * - Unified 9200: 9200XXXXX -> +9669200XXXXX
 * - Converts Eastern Arabic numerals (٠-٩) to standard ASCII digits
 * - Preserves international numbers starting with '+'
 */
export function standardizeSaudiPhone(raw = '') {
  if (!raw) return '';
  let str = String(raw).trim();

  // Convert Eastern Arabic numerals (٠-٩)
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }

  const hasPlus = str.startsWith('+');
  let digits = str.replace(/[^0-9]/g, '');

  if (str.startsWith('+966')) {
    let rest = str.slice(4).replace(/[^0-9]/g, '');
    if (rest.startsWith('0')) rest = rest.slice(1);
    return '+966' + rest;
  }
  if (digits.startsWith('00966')) {
    let rest = digits.slice(5);
    if (rest.startsWith('0')) rest = rest.slice(1);
    return '+966' + rest;
  }
  if (digits.startsWith('966') && digits.length >= 11) {
    let rest = digits.slice(3);
    if (rest.startsWith('0')) rest = rest.slice(1);
    return '+966' + rest;
  }

  // Mobile: 05XXXXXXXX (10 digits) -> +9665XXXXXXXX
  if (digits.startsWith('05') && digits.length === 10) {
    return '+966' + digits.slice(1);
  }
  // Mobile: 5XXXXXXXX (9 digits) -> +9665XXXXXXXX
  if (digits.startsWith('5') && digits.length === 9) {
    return '+966' + digits;
  }

  // Landlines: 011, 012, 013, 014, 016, 017 (10 digits) -> +9661X...
  if (/^01[123467]/.test(digits) && digits.length === 10) {
    return '+966' + digits.slice(1);
  }
  // Landlines: 11, 12, 13, 14, 16, 17 (9 digits) -> +9661X...
  if (/^1[123467]/.test(digits) && digits.length === 9) {
    return '+966' + digits;
  }

  // Unified number: 9200XXXXX
  if (digits.startsWith('9200') && digits.length === 9) {
    return '+966' + digits;
  }
  if (digits.startsWith('09200') && digits.length === 10) {
    return '+966' + digits.slice(1);
  }

  // Toll-free: 800
  if (digits.startsWith('800') && digits.length >= 10) {
    return '+966' + digits;
  }

  // International numbers with '+'
  if (hasPlus) {
    return '+' + digits;
  }

  // Fallback heuristics: 9 digits starting with 5 -> +966
  if (digits.length === 9 && digits.startsWith('5')) {
    return '+966' + digits;
  }
  if (digits.length === 10 && digits.startsWith('05')) {
    return '+966' + digits.slice(1);
  }

  return raw.trim();
}

/**
 * Helper to normalize Eastern Arabic numerals to standard digits for detection.
 */
function normalizeEasternArabicDigits(str = '') {
  const digits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(digits[i], 'g'), i.toString());
  }
  return res;
}

/**
 * Smart Raw Text Extractor.
 * Parses arbitrary text copied by phone users from Excel, Google Sheets, WhatsApp, or Notes.
 * Automatically splits and normalizes contact names, mobile phones, landlines, and emails.
 */
export function extractContactsFromRawText(text = '', autoStandardize = true) {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const contacts = [];

  // Helper to find a phone number candidate in a string (handling spaces, dashes, +966, 05, landlines)
  const findPhoneMatch = (rawStr) => {
    const norm = normalizeEasternArabicDigits(rawStr);
    const pattern = /(?:\+?966[\s\-]?)?(?:00966[\s\-]?)?(?:\(?0?5[0-9\s\-\(\)]{8,14}|\(?0?1[123467][0-9\s\-\(\)]{7,13}|9200[0-9\s\-]{5,10}|\+[0-9\s\-\(\)]{8,18})/g;
    let match;
    while ((match = pattern.exec(norm)) !== null) {
      const matchText = match[0].trim();
      const pureDigits = matchText.replace(/[^0-9]/g, '');
      if (pureDigits.length >= 8 && pureDigits.length <= 15) {
        const originalSlice = rawStr.slice(match.index, match.index + matchText.length);
        return { raw: originalSlice, normalized: matchText, digits: pureDigits };
      }
    }
    return null;
  };

  // Check if tab-separated (from Excel / Google Sheets)
  const hasTabs = lines.some(l => l.includes('\t'));
  if (hasTabs) {
    for (const line of lines) {
      const parts = line.split('\t').map(p => p.trim());
      if (parts.length === 0 || parts.every(p => !p)) continue;

      const contact = {};
      for (const part of parts) {
        if (!part) continue;
        if (part.includes('@')) {
          contact.email = part;
        } else if (/[0-9٠-٩]{7,}/.test(part.replace(/[^0-9٠-٩]/g, ''))) {
          const std = autoStandardize ? standardizeSaudiPhone(part) : part;
          if (std.startsWith('+9661') || /^01[123467]/.test(part)) {
            contact.phoneWork = std;
          } else {
            contact.phoneCell = std;
          }
        } else if (!contact.firstName) {
          const nameParts = part.split(/\s+/);
          if (nameParts.length > 1) {
            contact.firstName = nameParts.slice(0, -1).join(' ');
            contact.lastName = nameParts[nameParts.length - 1];
          } else {
            contact.firstName = part;
          }
        } else if (!contact.org) {
          contact.org = part;
        }
      }
      if (contact.firstName || contact.phoneCell || contact.phoneWork || contact.org) {
        contacts.push(contact);
      }
    }
    return contacts;
  }

  // Pattern-based parser for freeform text (WhatsApp, Notes, Chat)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let remaining = line;
    let email = '';
    const emailMatch = remaining.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      email = emailMatch[0];
      remaining = remaining.replace(email, ' ');
    }

    const phoneMatch = findPhoneMatch(remaining);

    if (phoneMatch) {
      const rawPhone = phoneMatch.raw;
      const namePart = remaining.replace(rawPhone, '').replace(/[:\-–—,\|]/g, ' ').replace(/\s+/g, ' ').trim();
      const std = autoStandardize ? standardizeSaudiPhone(rawPhone) : rawPhone;

      const contact = {};
      if (std.startsWith('+9661') || /^01[123467]/.test(phoneMatch.digits)) {
        contact.phoneWork = std;
      } else {
        contact.phoneCell = std;
      }

      if (email) contact.email = email;

      if (namePart) {
        const nameParts = namePart.split(/\s+/);
        if (nameParts.length > 1) {
          contact.firstName = nameParts.slice(0, -1).join(' ');
          contact.lastName = nameParts[nameParts.length - 1];
        } else {
          contact.firstName = namePart;
        }
      } else {
        contact.firstName = 'جهة اتصال';
      }
      contacts.push(contact);
    } else if (i + 1 < lines.length && findPhoneMatch(lines[i + 1])) {
      // Line i is Name, Line i+1 is Phone
      const nextPhoneMatch = findPhoneMatch(lines[i + 1]);
      const rawPhone = nextPhoneMatch.raw;
      const std = autoStandardize ? standardizeSaudiPhone(rawPhone) : rawPhone;
      const namePart = line.replace(/[:\-–—,\|]/g, ' ').replace(/\s+/g, ' ').trim();
      const nameParts = namePart.split(/\s+/);
      const contact = {};
      if (nameParts.length > 1) {
        contact.firstName = nameParts.slice(0, -1).join(' ');
        contact.lastName = nameParts[nameParts.length - 1];
      } else {
        contact.firstName = namePart;
      }
      if (std.startsWith('+9661') || /^01[123467]/.test(nextPhoneMatch.digits)) {
        contact.phoneWork = std;
      } else {
        contact.phoneCell = std;
      }
      if (email) contact.email = email;
      contacts.push(contact);
      i++; // advance past phone line
    }
  }

  return contacts;
}

/**
 * Escapes standard vCard text according to RFC specifications.
 */
function escapeVCard(value = '', isVersion4 = false) {
  if (!value) return '';
  let str = String(value);
  str = str.replace(/\\/g, '\\\\')
           .replace(/;/g, '\\;')
           .replace(/,/g, '\\,')
           .replace(/\r?\n/g, '\\n');
  return str;
}

/**
 * Checks if a contact row is completely empty.
 */
export function isContactEmpty(contact) {
  if (!contact) return true;
  return Object.values(contact).every(v => v === undefined || v === null || String(v).trim() === '');
}

/**
 * Exports contacts to vCard (.vcf) format.
 * Supports:
 * - version: '3.0' (Standard UTF-8)
 * - version: '3.0-qp' or '2.1-qp' (Quoted-Printable =D9=8A... for Arabic / Outlook / legacy devices)
 * - version: '4.0' (Modern UTF-8)
 * Completely omits empty fields and empty cards.
 */
export function exportToVCF(contacts = [], version = '3.0', options = {}) {
  const cards = [];
  const isV4 = version === '4.0';
  const isV2 = version === '2.1' || version === '2.1-qp';
  const useQP = options.useQuotedPrintable || version === '2.1-qp' || version === '3.0-qp';

  for (const c of contacts) {
    if (isContactEmpty(c)) continue;

    const lines = [];
    lines.push('BEGIN:VCARD');
    if (isV4) {
      lines.push('VERSION:4.0');
    } else if (isV2) {
      lines.push('VERSION:2.1');
    } else {
      lines.push('VERSION:3.0');
    }

    // Helper to format a property line with or without Quoted-Printable
    const formatProp = (propName, val, extraParams = '') => {
      if (!val || !val.trim()) return null;
      const cleanVal = val.trim();
      if (useQP && hasNonAscii(cleanVal)) {
        const qpVal = toQuotedPrintable(cleanVal);
        const params = extraParams
          ? `${extraParams};CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE`
          : ';CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE';
        return `${propName}${params}:${qpVal}`;
      } else {
        const params = extraParams ? `;${extraParams}` : '';
        return `${propName}${params}:${escapeVCard(cleanVal, isV4)}`;
      }
    };

    // Formatted Name (FN)
    const first = (c.firstName || '').trim();
    const last = (c.lastName || '').trim();
    let fn = '';
    if (first && last) {
      fn = `${first} ${last}`;
    } else if (first || last) {
      fn = first || last;
    } else if (c.org) {
      fn = c.org.trim();
    } else if (c.email || c.phoneCell) {
      fn = (c.email || c.phoneCell).trim();
    } else {
      fn = 'Unnamed Contact';
    }

    const fnLine = formatProp('FN', fn);
    if (fnLine) lines.push(fnLine);

    // Structured Name (N:Last;First;Middle;Prefix;Suffix)
    if (first || last) {
      if (useQP && (hasNonAscii(last) || hasNonAscii(first))) {
        const qpLast = toQuotedPrintable(last);
        const qpFirst = toQuotedPrintable(first);
        lines.push(`N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:${qpLast};${qpFirst};;;`);
      } else {
        lines.push(`N:${escapeVCard(last, isV4)};${escapeVCard(first, isV4)};;;`);
      }
    }

    // Organization & Title
    const orgLine = formatProp('ORG', c.org);
    if (orgLine) lines.push(orgLine);

    const titleLine = formatProp('TITLE', c.title);
    if (titleLine) lines.push(titleLine);

    // Phone Numbers
    if (c.phoneCell && c.phoneCell.trim()) {
      const phone = c.phoneCell.trim();
      if (isV4) {
        lines.push(`TEL;TYPE=cell,voice;VALUE=uri:tel:${phone.replace(/\s+/g, '')}`);
      } else if (isV2) {
        lines.push(`TEL;CELL;VOICE:${phone}`);
      } else {
        lines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
      }
    }
    if (c.phoneWork && c.phoneWork.trim()) {
      const phone = c.phoneWork.trim();
      if (isV4) {
        lines.push(`TEL;TYPE=work,voice;VALUE=uri:tel:${phone.replace(/\s+/g, '')}`);
      } else if (isV2) {
        lines.push(`TEL;WORK;VOICE:${phone}`);
      } else {
        lines.push(`TEL;TYPE=WORK,VOICE:${phone}`);
      }
    }

    // Emails
    if (c.email && c.email.trim()) {
      lines.push(isV4 ? `EMAIL;TYPE=home:${c.email.trim()}` : isV2 ? `EMAIL;INTERNET:${c.email.trim()}` : `EMAIL;TYPE=INTERNET,HOME:${c.email.trim()}`);
    }
    if (c.emailWork && c.emailWork.trim()) {
      lines.push(isV4 ? `EMAIL;TYPE=work:${c.emailWork.trim()}` : isV2 ? `EMAIL;INTERNET:${c.emailWork.trim()}` : `EMAIL;TYPE=INTERNET,WORK:${c.emailWork.trim()}`);
    }

    // Structured Address (ADR:;;Street;City;State;Zip;Country)
    const hasAddress = c.street || c.city || c.state || c.zip || c.country;
    if (hasAddress) {
      if (useQP && [c.street, c.city, c.state, c.zip, c.country].some(hasNonAscii)) {
        const qpStreet = toQuotedPrintable(c.street || '');
        const qpCity = toQuotedPrintable(c.city || '');
        const qpState = toQuotedPrintable(c.state || '');
        const qpZip = toQuotedPrintable(c.zip || '');
        const qpCountry = toQuotedPrintable(c.country || '');
        const adrPrefix = isV2
          ? 'ADR;HOME;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE'
          : 'ADR;TYPE=HOME;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE';
        lines.push(`${adrPrefix}:;;${qpStreet};${qpCity};${qpState};${qpZip};${qpCountry}`);
      } else {
        const street = escapeVCard(c.street || '', isV4);
        const city = escapeVCard(c.city || '', isV4);
        const state = escapeVCard(c.state || '', isV4);
        const zip = escapeVCard(c.zip || '', isV4);
        const country = escapeVCard(c.country || '', isV4);
        lines.push(`ADR;TYPE=HOME:;;${street};${city};${state};${zip};${country}`);
      }
    }

    // Website / URL
    if (c.website && c.website.trim()) {
      lines.push(`URL:${c.website.trim()}`);
    }

    // Birthday
    if (c.birthday && c.birthday.trim()) {
      const bday = c.birthday.trim().replace(/-/g, '');
      lines.push(`BDAY:${bday}`);
    }

    // Notes
    const noteLine = formatProp('NOTE', c.notes);
    if (noteLine) lines.push(noteLine);

    // Custom fields (any extra keys added by user)
    const knownKeys = new Set([
      'firstName', 'lastName', 'org', 'title', 'phoneCell', 'phoneWork',
      'email', 'emailWork', 'street', 'city', 'state', 'zip', 'country',
      'website', 'birthday', 'notes', '_id'
    ]);
    for (const [key, val] of Object.entries(c)) {
      if (!knownKeys.has(key) && val !== undefined && val !== null && String(val).trim()) {
        const cleanKey = key.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (cleanKey) {
          const customLine = formatProp(`X-${cleanKey}`, String(val));
          if (customLine) lines.push(customLine);
        }
      }
    }

    lines.push('END:VCARD');
    cards.push(lines.join('\r\n'));
  }

  return cards.join('\r\n\r\n');
}

/**
 * Escapes standard CSV/TSV values according to RFC 4180.
 */
function escapeDelimited(val = '', delimiter = ',') {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports to Google Contacts CSV format.
 */
export function exportToGoogleCSV(contacts = []) {
  const headers = [
    'Name',
    'Given Name',
    'Family Name',
    'E-mail 1 - Type',
    'E-mail 1 - Value',
    'E-mail 2 - Type',
    'E-mail 2 - Value',
    'Phone 1 - Type',
    'Phone 1 - Value',
    'Phone 2 - Type',
    'Phone 2 - Value',
    'Organization 1 - Name',
    'Organization 1 - Title',
    'Address 1 - Type',
    'Address 1 - Formatted',
    'Address 1 - Street',
    'Address 1 - City',
    'Address 1 - Region',
    'Address 1 - Postal Code',
    'Address 1 - Country',
    'Website 1 - Value',
    'Notes'
  ];

  const rows = [headers.map(h => escapeDelimited(h, ',')).join(',')];

  for (const c of contacts) {
    if (isContactEmpty(c)) continue;
    const first = (c.firstName || '').trim();
    const last = (c.lastName || '').trim();
    const name = first && last ? `${first} ${last}` : (first || last || c.org || '');

    const addrParts = [c.street, c.city, c.state, c.zip, c.country].filter(Boolean);
    const addrFormatted = addrParts.join(', ');

    const row = [
      name,
      first,
      last,
      c.email ? '* Home' : '',
      c.email || '',
      c.emailWork ? 'Work' : '',
      c.emailWork || '',
      c.phoneCell ? 'Mobile' : '',
      c.phoneCell || '',
      c.phoneWork ? 'Work' : '',
      c.phoneWork || '',
      c.org || '',
      c.title || '',
      addrFormatted ? 'Home' : '',
      addrFormatted,
      c.street || '',
      c.city || '',
      c.state || '',
      c.zip || '',
      c.country || '',
      c.website || '',
      c.notes || ''
    ];

    rows.push(row.map(v => escapeDelimited(v, ',')).join(','));
  }

  return rows.join('\r\n');
}

/**
 * Exports to Microsoft Outlook Contacts CSV format.
 */
export function exportToOutlookCSV(contacts = []) {
  const headers = [
    'First Name',
    'Last Name',
    'Company',
    'Job Title',
    'E-mail Address',
    'E-mail 2 Address',
    'Mobile Phone',
    'Business Phone',
    'Home Street',
    'Home City',
    'Home State',
    'Home Postal Code',
    'Home Country/Region',
    'Web Page',
    'Birthday',
    'Notes'
  ];

  const rows = [headers.map(h => escapeDelimited(h, ',')).join(',')];

  for (const c of contacts) {
    if (isContactEmpty(c)) continue;
    const row = [
      c.firstName || '',
      c.lastName || '',
      c.org || '',
      c.title || '',
      c.email || '',
      c.emailWork || '',
      c.phoneCell || '',
      c.phoneWork || '',
      c.street || '',
      c.city || '',
      c.state || '',
      c.zip || '',
      c.country || '',
      c.website || '',
      c.birthday || '',
      c.notes || ''
    ];
    rows.push(row.map(v => escapeDelimited(v, ',')).join(','));
  }

  return rows.join('\r\n');
}

/**
 * Exports to Standard CSV or TSV.
 * Optionally omits columns that have no values across any contact.
 */
export function exportToTableText(contacts = [], columns = [], delimiter = ',', omitEmptyCols = true) {
  let activeCols = [...columns];

  if (omitEmptyCols) {
    activeCols = activeCols.filter(col => {
      return contacts.some(c => c[col.id] !== undefined && c[col.id] !== null && String(c[col.id]).trim() !== '');
    });
  }

  const rows = [];
  rows.push(activeCols.map(col => escapeDelimited(col.label, delimiter)).join(delimiter));

  for (const c of contacts) {
    if (isContactEmpty(c)) continue;
    const row = activeCols.map(col => escapeDelimited(c[col.id] || '', delimiter));
    rows.push(row.join(delimiter));
  }

  return rows.join('\r\n');
}

/**
 * Exports contacts to JSON.
 * Omits empty fields from individual contact objects.
 */
export function exportToJSON(contacts = [], omitEmptyFields = true) {
  const result = [];

  for (const c of contacts) {
    if (isContactEmpty(c)) continue;
    const obj = {};
    for (const [key, val] of Object.entries(c)) {
      if (key.startsWith('_')) continue;
      if (omitEmptyFields) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          obj[key] = typeof val === 'string' ? val.trim() : val;
        }
      } else {
        obj[key] = val ?? '';
      }
    }
    if (Object.keys(obj).length > 0) {
      result.push(obj);
    }
  }

  return JSON.stringify(result, null, 2);
}

/**
 * Parses a vCard (.vcf) text string into a list of contact objects.
 * Automatically decodes Quoted-Printable Arabic / non-ASCII (=D9=8A...) and folded lines.
 */
export function parseVCF(vcfText = '') {
  const contacts = [];
  const cardBlocks = vcfText.split(/BEGIN:VCARD/i).slice(1);

  for (const block of cardBlocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const contact = {};

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.toUpperCase() === 'END:VCARD') break;

      // Handle folded lines (RFC allows lines starting with space or tab, or QP soft break '=')
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (line.endsWith('=')) {
          // Quoted-Printable soft line break
          line = line.slice(0, -1) + nextLine;
          i++;
        } else if (nextLine.startsWith(' ') || nextLine.startsWith('\t')) {
          line += nextLine.slice(1);
          i++;
        } else {
          break;
        }
      }

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const rawProp = line.slice(0, colonIdx);
      const rawVal = line.slice(colonIdx + 1);

      // Strip property params (e.g. TEL;TYPE=CELL -> prop=TEL, params=TYPE=CELL)
      const propParts = rawProp.split(';');
      const propName = propParts[0].toUpperCase();
      const propParams = propParts.slice(1).join(';').toUpperCase();

      // Check if property is Quoted-Printable encoded (e.g. Arabic =D9=8A...)
      const isQP = propParams.includes('QUOTED-PRINTABLE') || /=([0-9A-Fa-f]{2})/i.test(rawVal);
      let val = rawVal;

      if (isQP) {
        val = decodeQuotedPrintable(rawVal);
      } else {
        val = val
          .replace(/\\n/gi, '\n')
          .replace(/\\,/g, ',')
          .replace(/\\;/g, ';')
          .replace(/\\\\/g, '\\')
          .trim();
      }

      if (!val) continue;

      switch (propName) {
        case 'N': {
          const parts = val.split(';');
          contact.lastName = (parts[0] || '').trim();
          contact.firstName = (parts[1] || '').trim();
          break;
        }
        case 'FN': {
          if (!contact.firstName && !contact.lastName) {
            const nameParts = val.split(/\s+/);
            if (nameParts.length > 1) {
              contact.firstName = nameParts.slice(0, -1).join(' ');
              contact.lastName = nameParts[nameParts.length - 1];
            } else {
              contact.firstName = val;
            }
          }
          break;
        }
        case 'ORG': {
          contact.org = val.split(';')[0].trim();
          break;
        }
        case 'TITLE': {
          contact.title = val;
          break;
        }
        case 'TEL': {
          const cleanPhone = val.replace(/^tel:/i, '');
          if (propParams.includes('WORK') && !contact.phoneWork) {
            contact.phoneWork = cleanPhone;
          } else if (!contact.phoneCell) {
            contact.phoneCell = cleanPhone;
          } else if (!contact.phoneWork) {
            contact.phoneWork = cleanPhone;
          }
          break;
        }
        case 'EMAIL': {
          if (propParams.includes('WORK') && !contact.emailWork) {
            contact.emailWork = val;
          } else if (!contact.email) {
            contact.email = val;
          } else if (!contact.emailWork) {
            contact.emailWork = val;
          }
          break;
        }
        case 'ADR': {
          const adrParts = val.split(';');
          // Format: pobox;extended;street;city;state;zip;country
          if (adrParts[2]) contact.street = adrParts[2].trim();
          if (adrParts[3]) contact.city = adrParts[3].trim();
          if (adrParts[4]) contact.state = adrParts[4].trim();
          if (adrParts[5]) contact.zip = adrParts[5].trim();
          if (adrParts[6]) contact.country = adrParts[6].trim();
          break;
        }
        case 'URL': {
          if (!contact.website) contact.website = val;
          break;
        }
        case 'BDAY': {
          contact.birthday = val;
          break;
        }
        case 'NOTE': {
          contact.notes = val;
          break;
        }
      }
    }

    if (!isContactEmpty(contact)) {
      contacts.push(contact);
    }
  }

  return contacts;
}

/**
 * Parses Delimited Text (CSV or TSV).
 */
export function parseCSV(text = '', delimiter = ',') {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some(v => v.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(v => v.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}
