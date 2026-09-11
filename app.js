/**
 * app.js
 * Main application controller with Arabic default, dynamic RTL/LTR language switcher,
 * Quoted-Printable vCard Arabic export, and Excel UTF-8 BOM compatibility.
 */

import { ContactSheet } from './sheet.js';
import {
  exportToVCF,
  exportToGoogleCSV,
  exportToOutlookCSV,
  exportToTableText,
  exportToJSON,
  parseVCF,
  parseCSV,
  isContactEmpty,
  DEFAULT_COLUMNS,
  standardizeSaudiPhone,
  extractContactsFromRawText
} from './converters.js';
import { TRANSLATIONS } from './i18n.js';

// Realistic sample contacts to demonstrate varied data, Arabic support, and empty-field pruning
const SAMPLE_CONTACTS = [
  {
    firstName: 'يعقوب',
    lastName: 'العتيبي',
    org: 'شركة التقنية المتقدمة',
    title: 'مدير العمليات والتطوير',
    phoneCell: '+966 50 123 4567',
    phoneWork: '+966 11 456 7890',
    email: 'yaqoub@alotaibi-tech.sa',
    street: 'طريق الملك فهد، حي الصحافة',
    city: 'الرياض',
    country: 'المملكة العربية السعودية',
    website: 'https://alotaibi-tech.sa',
    notes: 'شريك استراتيجي في إدارة وتصدير قواعد البيانات'
  },
  {
    firstName: 'فاطمة',
    lastName: 'الزهراء',
    org: 'مجموعة الأفق للاستثمار',
    title: 'رئيسة الشراكات',
    phoneCell: '+971 50 987 6543',
    email: 'fatima@alofooq.ae',
    city: 'دبي',
    country: 'الإمارات العربية المتحدة'
  },
  {
    firstName: 'Sarah',
    lastName: 'Connor',
    org: 'Cyberdyne Systems',
    title: 'Operations Director',
    phoneCell: '+1 (415) 555-0192',
    phoneWork: '+1 (415) 555-0199',
    email: 'sarah.connor@example.com',
    emailWork: 'sconnor@cyberdyne.org',
    street: '124 Los Robles Ave',
    city: 'Pasadena',
    state: 'CA',
    zip: '91101',
    country: 'United States',
    website: 'https://example.com/sarah',
    birthday: '1985-05-12',
    notes: 'Key partner for security audit.'
  },
  {
    firstName: 'Marcus',
    lastName: 'Vance',
    org: 'Apex Logistics',
    title: 'Lead Architect',
    phoneCell: '+1 (206) 555-0144',
    email: 'mvance@apexlog.io',
    city: 'Seattle',
    state: 'WA',
    country: 'United States'
  },
  {
    firstName: 'David',
    lastName: 'Chen',
    org: 'Pacific Freight',
    phoneCell: '+1 (604) 555-0811',
    phoneWork: '+1 (604) 555-0822',
    email: 'dchen@pacfreight.ca',
    city: 'Vancouver',
    country: 'Canada'
  }
];

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  let currentLang = localStorage.getItem('vcf_creator_lang') || 'ar';

  const container = document.getElementById('sheet-container');
  const coordDisplay = document.getElementById('cell-coord');
  const formulaInput = document.getElementById('formula-input');
  const statContacts = document.getElementById('stat-contacts-count');
  const statCols = document.getElementById('stat-columns-count');
  const statEmpty = document.getElementById('stat-empty-count');
  const statusBadge = document.getElementById('app-status-badge');
  const footerStatus = document.getElementById('footer-status-text');

  // Modals, Drawer & Controls
  const exportModal = document.getElementById('export-modal');
  const importModal = document.getElementById('import-modal');
  const colModal = document.getElementById('col-modal');
  const quickPasteModal = document.getElementById('quick-paste-modal');

  const btnToggleDrawer = document.getElementById('btn-toggle-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');

  const btnPasteToCell = document.getElementById('btn-paste-to-cell');
  const btnDrawerPaste = document.getElementById('btn-drawer-paste');
  const btnFormulaPaste = document.getElementById('btn-formula-paste');
  const btnStandardizePhones = document.getElementById('btn-standardize-phones');
  const btnDrawerStd = document.getElementById('btn-drawer-std');
  const btnDrawerAddRow = document.getElementById('btn-drawer-add-row');
  const btnDrawerExport = document.getElementById('btn-drawer-export');

  const btnQuickPaste = document.getElementById('btn-quick-paste');
  const btnCloseQuickPaste = document.getElementById('btn-close-quick-paste');
  const btnCancelQuickPaste = document.getElementById('btn-cancel-quick-paste');
  const btnApplyQuickPaste = document.getElementById('btn-apply-quick-paste');
  const quickPasteInput = document.getElementById('quick-paste-input');
  const chkAutoStd = document.getElementById('quick-paste-autostd');
  const quickPastePreview = document.getElementById('quick-paste-preview');
  const quickPasteCount = document.getElementById('quick-paste-count');

  const statDrawerContacts = document.getElementById('stat-drawer-contacts');
  const statDrawerCols = document.getElementById('stat-drawer-cols');
  const statDrawerEmpty = document.getElementById('stat-drawer-empty');

  const t = (key) => {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
    return dict[key] || '';
  };

  // Drawer management
  function openDrawer() {
    document.body.classList.add('drawer-open');
  }

  function closeDrawer() {
    document.body.classList.remove('drawer-open');
  }

  if (btnToggleDrawer) btnToggleDrawer.addEventListener('click', openDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) {
      closeDrawer();
    }
  });

  // Initialize Spreadsheet Grid with active language
  const sheet = new ContactSheet(container, {
    lang: currentLang,
    onSelectionChange: (sel) => {
      const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
      if (sel.range && !sel.range.isSingleCell) {
        coordDisplay.textContent = dict.cellCoordRange
          .replace('{rows}', sel.range.rowCount)
          .replace('{cols}', sel.range.colCount)
          .replace('{cells}', sel.range.cellCount);
        if (document.activeElement !== formulaInput) {
          formulaInput.value = '';
          formulaInput.placeholder = dict.cellPlaceholderMulti.replace('{cells}', sel.range.cellCount);
        }
      } else {
        const colLabel = sel.column ? sel.column.label : `${dict.cellCoordCol} ${sel.colIndex + 1}`;
        coordDisplay.textContent = `${dict.cellCoordPrefix} ${sel.rowIndex + 1} : ${colLabel}`;
        if (document.activeElement !== formulaInput) {
          formulaInput.value = sel.value || '';
          formulaInput.placeholder = dict.cellPlaceholderSingle;
        }
      }
    },
    onDataChange: (stats) => {
      const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
      statContacts.textContent = stats.activeContactsCount;
      statCols.textContent = stats.visibleColumnsCount;
      statEmpty.textContent = stats.emptyColumnsCount;

      if (statDrawerContacts) statDrawerContacts.textContent = stats.activeContactsCount;
      if (statDrawerCols) statDrawerCols.textContent = stats.visibleColumnsCount;
      if (statDrawerEmpty) statDrawerEmpty.textContent = stats.emptyColumnsCount;

      statusBadge.textContent = `${stats.activeContactsCount} ${currentLang === 'ar' ? 'جهات اتصال' : 'Contacts'}`;
      footerStatus.textContent = dict.footerStatus
        .replace('{rows}', stats.totalRows)
        .replace('{cols}', stats.visibleColumnsCount)
        .replace('{empty}', stats.emptyColumnsCount);
    },
    onToast: (msg) => showToast(msg)
  });

  // Load Initial Data (Sample Contacts by default)
  sheet.loadData(SAMPLE_CONTACTS);

  // Update UI Language & Direction
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('vcf_creator_lang', lang);
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.ar;

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const txtMenuToggle = document.getElementById('txt-menu-toggle');
    if (txtMenuToggle) txtMenuToggle.textContent = dict.btnMenuToggle;

    const btnLang = document.getElementById('btn-lang-toggle');
    const txtLangToggle = document.getElementById('txt-lang-toggle');
    if (txtLangToggle) txtLangToggle.textContent = dict.langToggle;
    if (btnLang && !txtLangToggle) btnLang.textContent = dict.langToggle;

    document.getElementById('brand-title').textContent = dict.appTitle;
    document.getElementById('app-status-badge').textContent = dict.statusReady;

    const txtAddRow = document.getElementById('txt-add-row');
    if (txtAddRow) txtAddRow.textContent = dict.btnAddRow;

    const txtAddCol = document.getElementById('txt-add-col');
    if (txtAddCol) txtAddCol.textContent = dict.btnAddCol;

    const txtToggleEmpty = document.getElementById('txt-toggle-empty');
    if (txtToggleEmpty) txtToggleEmpty.textContent = dict.btnHideEmpty;

    const txtPurgeEmpty = document.getElementById('txt-purge-empty');
    if (txtPurgeEmpty) txtPurgeEmpty.textContent = dict.btnPurgeEmpty;

    const txtSampleData = document.getElementById('txt-sample-data');
    if (txtSampleData) txtSampleData.textContent = dict.btnSampleData;

    const txtClearTable = document.getElementById('txt-clear-table');
    if (txtClearTable) txtClearTable.textContent = dict.btnClearTable;

    const txtImport = document.getElementById('txt-import');
    if (txtImport) txtImport.textContent = dict.btnImport;

    const txtExport = document.getElementById('txt-export');
    if (txtExport) txtExport.textContent = dict.btnExport;

    // Header & Drawer Action Labels
    const txtPasteToCell = document.getElementById('txt-paste-to-cell');
    if (txtPasteToCell) txtPasteToCell.textContent = dict.btnPasteToCell || 'لصق 📋';

    const txtDrawerPaste = document.getElementById('txt-drawer-paste');
    if (txtDrawerPaste) txtDrawerPaste.textContent = dict.drawerPasteLabel || 'لصق في الخلية النشطة';

    const txtDrawerAddRow = document.getElementById('txt-drawer-add-row');
    if (txtDrawerAddRow) txtDrawerAddRow.textContent = dict.btnAddRow;

    const txtDrawerExport = document.getElementById('txt-drawer-export');
    if (txtDrawerExport) txtDrawerExport.textContent = dict.btnExport;

    const txtDrawerStd = document.getElementById('txt-drawer-std');
    if (txtDrawerStd) txtDrawerStd.textContent = dict.btnStandardizePhones;

    const txtQuickPaste = document.getElementById('txt-quick-paste');
    if (txtQuickPaste) txtQuickPaste.textContent = dict.quickPasteTitle || 'مساعد اللصق والاستخراج';

    const txtStd = document.getElementById('txt-standardize-phones');
    if (txtStd) txtStd.textContent = '+966 ⚡';

    // Drawer Section Headers & Descriptions
    const drawerTitle = document.getElementById('drawer-title');
    if (drawerTitle) drawerTitle.textContent = dict.drawerTitle;

    const lblSecData = document.getElementById('lbl-sec-data');
    if (lblSecData) lblSecData.textContent = dict.lblSecData;

    const lblSecSheet = document.getElementById('lbl-sec-sheet');
    if (lblSecSheet) lblSecSheet.textContent = dict.lblSecSheet;

    const lblSecActions = document.getElementById('lbl-sec-actions');
    if (lblSecActions) lblSecActions.textContent = dict.lblSecActions;

    const lblSecLang = document.getElementById('lbl-sec-lang');
    if (lblSecLang) lblSecLang.textContent = dict.lblSecLang;

    const descDrawerPaste = document.getElementById('desc-drawer-paste');
    if (descDrawerPaste) descDrawerPaste.textContent = dict.drawerPasteDesc;

    const descQuickPaste = document.getElementById('desc-quick-paste');
    if (descQuickPaste) descQuickPaste.textContent = dict.drawerQuickPasteDesc;

    const descDrawerStd = document.getElementById('desc-drawer-std');
    if (descDrawerStd) descDrawerStd.textContent = dict.drawerStdDesc;

    const descDrawerAddRow = document.getElementById('desc-drawer-add-row');
    if (descDrawerAddRow) descDrawerAddRow.textContent = dict.drawerAddRowDesc;

    const descAddCol = document.getElementById('desc-add-col');
    if (descAddCol) descAddCol.textContent = dict.drawerAddColDesc;

    const descToggleEmpty = document.getElementById('desc-toggle-empty');
    if (descToggleEmpty) descToggleEmpty.textContent = dict.drawerHideEmptyDesc;

    const descPurgeEmpty = document.getElementById('desc-purge-empty');
    if (descPurgeEmpty) descPurgeEmpty.textContent = dict.drawerPurgeEmptyDesc;

    const descImport = document.getElementById('desc-import');
    if (descImport) descImport.textContent = dict.drawerImportDesc;

    const descDrawerExport = document.getElementById('desc-drawer-export');
    if (descDrawerExport) descDrawerExport.textContent = dict.drawerExportDesc;

    const descSampleData = document.getElementById('desc-sample-data');
    if (descSampleData) descSampleData.textContent = dict.drawerSampleDesc;

    const descClearTable = document.getElementById('desc-clear-table');
    if (descClearTable) descClearTable.textContent = dict.drawerClearDesc;

    const descLangToggle = document.getElementById('desc-lang-toggle');
    if (descLangToggle) descLangToggle.textContent = dict.drawerLangDesc;

    const lblDrawerContacts = document.getElementById('lbl-drawer-contacts');
    if (lblDrawerContacts) lblDrawerContacts.textContent = dict.statContacts;

    const lblDrawerCols = document.getElementById('lbl-drawer-cols');
    if (lblDrawerCols) lblDrawerCols.textContent = dict.statActiveCols;

    const lblDrawerEmpty = document.getElementById('lbl-drawer-empty');
    if (lblDrawerEmpty) lblDrawerEmpty.textContent = dict.statEmptyCols;

    document.getElementById('lbl-stat-contacts').textContent = dict.statContacts;
    document.getElementById('lbl-stat-columns').textContent = dict.statActiveCols;
    document.getElementById('lbl-stat-empty').textContent = dict.statEmptyCols;

    const shortcutsEl = document.getElementById('footer-shortcuts');
    if (shortcutsEl) {
      if (lang === 'ar') {
        shortcutsEl.innerHTML = `
          <span>التحديد: <span class="kbd-shortcut">نقر وسحب</span> / <span class="kbd-shortcut">Shift+الأسهم</span></span>
          <span>التعديل: <span class="kbd-shortcut">نقر مزدوج</span> أو بدء الكتابة</span>
          <span>النسخ: <span class="kbd-shortcut">Ctrl+C</span></span>
          <span>المسح: <span class="kbd-shortcut">Delete</span></span>
          <span>التراجع: <span class="kbd-shortcut">Ctrl+Z / Y</span></span>
          <span>اللصق: <span class="kbd-shortcut">Ctrl+V</span></span>
        `;
      } else {
        shortcutsEl.innerHTML = `
          <span>Select: <span class="kbd-shortcut">Click &amp; Drag</span> / <span class="kbd-shortcut">Shift+Arrows</span></span>
          <span>Edit: <span class="kbd-shortcut">Double-Click</span> or Start Typing</span>
          <span>Copy: <span class="kbd-shortcut">Ctrl+C</span></span>
          <span>Clear: <span class="kbd-shortcut">Delete</span></span>
          <span>Undo/Redo: <span class="kbd-shortcut">Ctrl+Z / Y</span></span>
          <span>Paste: <span class="kbd-shortcut">Ctrl+V</span></span>
        `;
      }
    }

    // Quick Paste Modal
    document.getElementById('quick-paste-title').textContent = dict.quickPasteTitle;
    document.getElementById('quick-paste-desc').textContent = dict.quickPasteDesc;
    document.getElementById('quick-paste-input').placeholder = dict.quickPastePlaceholder;
    document.getElementById('lbl-quick-paste-autostd').textContent = dict.quickPasteOptAutoStd;
    document.getElementById('lbl-quick-paste-replace').textContent = dict.quickPasteOptReplace;
    document.getElementById('lbl-quick-paste-append').textContent = dict.quickPasteOptAppend;
    document.getElementById('lbl-quick-paste-preview').textContent = dict.quickPastePreviewTitle;
    document.getElementById('btn-apply-quick-paste').textContent = dict.quickPasteBtnApply;
    document.getElementById('btn-cancel-quick-paste').textContent = dict.colModalCancel;

    document.getElementById('export-modal-title').textContent = dict.exportModalTitle;
    document.getElementById('lbl-export-format').textContent = dict.exportFormatLabel;
    document.getElementById('lbl-export-filename').textContent = dict.exportFilenameLabel;
    document.getElementById('lbl-export-preview').textContent = dict.exportPreviewHeader;
    document.getElementById('btn-copy-export').textContent = dict.exportBtnCopy;
    document.getElementById('btn-download-export').textContent = dict.exportBtnDownload;
    document.getElementById('lbl-export-qp').innerHTML = dict.exportQpOption.replace('(=D9=8A...', '(<code>=D9=8A...</code>');

    document.getElementById('import-modal-title').textContent = dict.importModalTitle;
    document.getElementById('import-drop-text').textContent = dict.importDropText;
    document.getElementById('import-drop-hint').textContent = dict.importDropHint;
    document.getElementById('btn-cancel-import').textContent = dict.importCancel;

    document.getElementById('col-modal-title').textContent = dict.colModalTitle;
    document.getElementById('lbl-col-name').textContent = dict.colModalLabel;
    document.getElementById('new-col-name').placeholder = dict.colModalPlaceholder;
    document.getElementById('btn-cancel-col').textContent = dict.colModalCancel;
    document.getElementById('btn-confirm-col').textContent = dict.colModalConfirm;

    sheet.setLanguage(lang);
    updateExportPreview();
  }

  // Language Toggle Button Listener
  document.getElementById('btn-lang-toggle').addEventListener('click', () => {
    applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
  });

  // Formula bar input synchronization
  formulaInput.addEventListener('input', () => {
    sheet.setActiveCellValue(formulaInput.value);
  });

  formulaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sheet.scrollPane.focus({ preventScroll: true });
    }
  });

  // Direct 1-Tap Paste to Cell Buttons (Header, Drawer & Formula Bar)
  if (btnPasteToCell) {
    btnPasteToCell.addEventListener('click', () => {
      sheet.pasteFromClipboard();
    });
  }

  if (btnDrawerPaste) {
    btnDrawerPaste.addEventListener('click', () => {
      closeDrawer();
      sheet.pasteFromClipboard();
    });
  }

  if (btnFormulaPaste) {
    btnFormulaPaste.addEventListener('click', () => {
      sheet.pasteFromClipboard();
    });
  }

  function handleAddRow() {
    sheet.addRow();
    showToast(t('toastRowAdded'));
  }

  document.getElementById('btn-add-row').addEventListener('click', handleAddRow);
  if (btnDrawerAddRow) {
    btnDrawerAddRow.addEventListener('click', () => {
      closeDrawer();
      handleAddRow();
    });
  }

  document.getElementById('btn-add-col').addEventListener('click', () => {
    closeDrawer();
    colModal.showModal();
    const input = document.getElementById('new-col-name');
    input.value = '';
    input.focus();
  });

  document.getElementById('btn-confirm-col').addEventListener('click', () => {
    const input = document.getElementById('new-col-name');
    const name = input.value.trim();
    if (name) {
      sheet.addColumn(name);
      colModal.close();
      showToast(t('toastColCreated').replace('{name}', name));
    }
  });

  document.getElementById('btn-cancel-col').addEventListener('click', () => colModal.close());
  document.getElementById('btn-close-col').addEventListener('click', () => colModal.close());

  // Toggle Hide Empty Columns
  const btnToggleEmpty = document.getElementById('btn-toggle-empty');
  const txtToggleEmpty = document.getElementById('txt-toggle-empty');

  btnToggleEmpty.addEventListener('click', () => {
    closeDrawer();
    const result = sheet.toggleHideEmptyColumns();
    if (!result.changed) {
      showToast(t('toastNoEmpty'));
    } else {
      if (result.areHidden) {
        btnToggleEmpty.classList.add('btn-primary');
        txtToggleEmpty.textContent = t('btnUnhideEmpty').replace('{count}', result.count);
        showToast(t('toastHiddenEmpty').replace('{count}', result.count));
      } else {
        btnToggleEmpty.classList.remove('btn-primary');
        txtToggleEmpty.textContent = t('btnHideEmpty');
        showToast(t('toastUnhiddenEmpty'));
      }
    }
  });

  // Purge Empty Columns
  document.getElementById('btn-purge-empty').addEventListener('click', () => {
    closeDrawer();
    const count = sheet.purgeEmptyColumns();
    if (count === 0) {
      showToast(t('toastNoEmpty'));
    } else {
      showToast(t('toastPurgedEmpty').replace('{count}', count));
      btnToggleEmpty.classList.remove('btn-primary');
      txtToggleEmpty.textContent = t('btnHideEmpty');
    }
  });

  // Load Sample Data
  document.getElementById('btn-sample-data').addEventListener('click', () => {
    closeDrawer();
    sheet.loadData(SAMPLE_CONTACTS);
    showToast(t('toastSampleLoaded'));
  });

  // Clear Table
  document.getElementById('btn-clear-table').addEventListener('click', () => {
    closeDrawer();
    const confirmMsg = currentLang === 'ar' ? 'هل تريد بالتأكيد مسح جميع جهات الاتصال وإعادة التعيين؟' : 'Clear all contacts and reset spreadsheet?';
    if (confirm(confirmMsg)) {
      sheet.clearAllRows();
      showToast(t('toastReset'));
    }
  });

  // Standardize Saudi Phone Numbers (+966)
  function handleStandardizePhones() {
    const count = sheet.standardizeAllPhones();
    if (count > 0) {
      showToast(t('toastPhonesStandardized').replace('{count}', count));
    } else {
      showToast(t('toastNoPhonesNeedStandardizing'));
    }
  }

  if (btnStandardizePhones) {
    btnStandardizePhones.addEventListener('click', handleStandardizePhones);
  }

  if (btnDrawerStd) {
    btnDrawerStd.addEventListener('click', () => {
      closeDrawer();
      handleStandardizePhones();
    });
  }

  if (btnDrawerExport) {
    btnDrawerExport.addEventListener('click', () => {
      closeDrawer();
      updateExportPreview();
      exportModal.showModal();
    });
  }

  // Quick Paste & Smart Extraction Management
  let extractedContacts = [];

  function updateQuickPastePreview() {
    const rawText = quickPasteInput.value;
    const autoStd = chkAutoStd.checked;
    extractedContacts = extractContactsFromRawText(rawText, autoStd);

    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;

    if (extractedContacts.length === 0) {
      btnApplyQuickPaste.disabled = true;
      quickPasteCount.textContent = dict.quickPasteCount.replace('{count}', '0');
      quickPastePreview.innerHTML = `
        <div class="quick-paste-empty-hint">${dict.quickPasteEmpty}</div>
      `;
      return;
    }

    btnApplyQuickPaste.disabled = false;
    quickPasteCount.textContent = dict.quickPasteCount.replace('{count}', extractedContacts.length);

    let html = '';
    for (const c of extractedContacts.slice(0, 50)) {
      const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.org || (currentLang === 'ar' ? 'جهة اتصال' : 'Contact');
      const phones = [c.phoneCell, c.phoneWork].filter(Boolean).join(' | ');
      html += `
        <div class="quick-preview-item">
          <div class="quick-preview-left">
            <span class="quick-preview-name">${sheet.escapeHTML(name)}</span>
            ${c.org ? `<span class="quick-preview-org">${sheet.escapeHTML(c.org)}</span>` : ''}
            ${c.email ? `<span class="quick-preview-org">${sheet.escapeHTML(c.email)}</span>` : ''}
          </div>
          <div class="quick-preview-phones">
            <span class="quick-preview-phone" dir="ltr">${sheet.escapeHTML(phones)}</span>
          </div>
        </div>
      `;
    }
    if (extractedContacts.length > 50) {
      html += `
        <div style="padding: 6px 12px; text-align: center; color: var(--text-muted); font-size: 11px;">
          + ${extractedContacts.length - 50} ${currentLang === 'ar' ? 'جهة اتصال إضافية...' : 'more contacts...'}
        </div>
      `;
    }
    quickPastePreview.innerHTML = html;
  }

  function openQuickPasteModal() {
    closeDrawer();
    quickPasteModal.showModal();
    quickPasteInput.focus();
    updateQuickPastePreview();
  }

  if (btnQuickPaste) {
    btnQuickPaste.addEventListener('click', openQuickPasteModal);
  }

  btnCloseQuickPaste.addEventListener('click', () => quickPasteModal.close());
  btnCancelQuickPaste.addEventListener('click', () => quickPasteModal.close());

  quickPasteInput.addEventListener('input', updateQuickPastePreview);
  quickPasteInput.addEventListener('paste', () => setTimeout(updateQuickPastePreview, 10));
  chkAutoStd.addEventListener('change', updateQuickPastePreview);

  btnApplyQuickPaste.addEventListener('click', () => {
    if (extractedContacts.length === 0) {
      showToast(t('toastQuickPasteNoContacts'));
      return;
    }

    const mode = document.querySelector('input[name="quickPasteMode"]:checked')?.value || 'replace';
    if (mode === 'replace') {
      sheet.loadData(extractedContacts);
    } else {
      for (const c of extractedContacts) {
        sheet.addRow(c);
      }
    }

    quickPasteModal.close();
    showToast(t('toastQuickPasteSuccess').replace('{count}', extractedContacts.length));
  });

  // Export Modal Management
  const exportFormatPills = document.querySelectorAll('#export-format-pills .format-pill');
  const previewBox = document.getElementById('export-preview');
  const previewMeta = document.getElementById('preview-meta');
  const filenameInput = document.getElementById('export-filename');
  let currentFormat = 'vcf3';

  const chkUseQP = document.getElementById('chk-use-qp');
  const qpWrapper = document.getElementById('qp-option-wrapper');

  function updateExportPreview() {
    const contacts = sheet.getContacts();
    let content = '';
    let ext = 'vcf';
    let baseName = currentLang === 'ar' ? 'جهات_الاتصال' : 'contacts';

    const isVCF = currentFormat === 'vcf3' || currentFormat === 'vcf-qp' || currentFormat === 'vcf4';
    if (qpWrapper) {
      qpWrapper.style.display = isVCF ? 'block' : 'none';
    }

    const useQP = currentFormat === 'vcf-qp' || (chkUseQP && chkUseQP.checked);

    switch (currentFormat) {
      case 'vcf3':
        content = exportToVCF(contacts, '3.0', { useQuotedPrintable: useQP });
        ext = 'vcf';
        break;
      case 'vcf-qp':
        content = exportToVCF(contacts, '3.0', { useQuotedPrintable: true });
        ext = 'vcf';
        baseName = currentLang === 'ar' ? 'جهات_الاتصال_معرب_qp' : 'contacts_arabic_qp';
        break;
      case 'vcf4':
        content = exportToVCF(contacts, '4.0', { useQuotedPrintable: false });
        ext = 'vcf';
        break;
      case 'google-csv':
        content = exportToGoogleCSV(contacts);
        ext = 'csv';
        baseName = currentLang === 'ar' ? 'جهات_اتصال_جوجل' : 'google_contacts';
        break;
      case 'outlook-csv':
        content = exportToOutlookCSV(contacts);
        ext = 'csv';
        baseName = currentLang === 'ar' ? 'جهات_اتصال_اوتلوك' : 'outlook_contacts';
        break;
      case 'clean-csv':
        content = exportToTableText(contacts, sheet.columns, ',', true);
        ext = 'csv';
        break;
      case 'tsv':
        content = exportToTableText(contacts, sheet.columns, '\t', true);
        ext = 'tsv';
        break;
      case 'json':
        content = exportToJSON(contacts, true);
        ext = 'json';
        break;
    }

    previewBox.textContent = content || (currentLang === 'ar' ? '(لا توجد جهات اتصال صالحة للتصدير)' : '(No non-empty contacts to export)');
    const lines = content ? content.split('\n').length : 0;
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
    previewMeta.textContent = dict.exportCharsCount
      .replace('{lines}', lines)
      .replace('{chars}', content.length);
    filenameInput.value = `${baseName}.${ext}`;
  }

  if (chkUseQP) {
    chkUseQP.addEventListener('change', () => {
      updateExportPreview();
    });
  }

  exportFormatPills.forEach(pill => {
    pill.addEventListener('click', () => {
      exportFormatPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const radio = pill.querySelector('input');
      radio.checked = true;
      currentFormat = radio.value;

      if (currentFormat === 'vcf-qp' && chkUseQP) {
        chkUseQP.checked = true;
      }

      updateExportPreview();
    });
  });

  document.getElementById('btn-open-export').addEventListener('click', () => {
    updateExportPreview();
    exportModal.showModal();
  });

  document.getElementById('btn-close-export').addEventListener('click', () => exportModal.close());

  // Copy to Clipboard
  document.getElementById('btn-copy-export').addEventListener('click', () => {
    const content = previewBox.textContent;
    if (!content || content.startsWith('(')) {
      showToast(t('toastNothingToCopy'));
      return;
    }
    navigator.clipboard.writeText(content).then(() => {
      showToast(t('toastCopied'));
    }).catch(() => {
      showToast('Error copying to clipboard');
    });
  });

  // Download File (with UTF-8 BOM for Arabic CSV/TSV Excel compatibility)
  document.getElementById('btn-download-export').addEventListener('click', () => {
    const content = previewBox.textContent;
    if (!content || content.startsWith('(')) {
      showToast(t('toastNothingToExport'));
      return;
    }

    const filename = filenameInput.value.trim() || 'contacts.vcf';
    let mimeType = 'text/plain;charset=utf-8';
    let outputData = content;

    if (filename.endsWith('.vcf')) {
      mimeType = 'text/vcard;charset=utf-8';
    } else if (filename.endsWith('.csv')) {
      mimeType = 'text/csv;charset=utf-8';
      // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens Arabic characters cleanly without mojibake
      outputData = '\uFEFF' + content;
    } else if (filename.endsWith('.tsv')) {
      mimeType = 'text/tab-separated-values;charset=utf-8';
      outputData = '\uFEFF' + content;
    } else if (filename.endsWith('.json')) {
      mimeType = 'application/json;charset=utf-8';
    }

    const blob = new Blob([outputData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(t('toastDownloaded').replace('{file}', filename));
    exportModal.close();
  });

  // Import Modal Management
  const dropZone = document.getElementById('import-drop-zone');
  const fileInput = document.getElementById('file-input');

  document.getElementById('btn-open-import').addEventListener('click', () => {
    closeDrawer();
    importModal.showModal();
  });

  document.getElementById('btn-close-import').addEventListener('click', () => importModal.close());
  document.getElementById('btn-cancel-import').addEventListener('click', () => importModal.close());

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImportFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImportFile(e.target.files[0]);
    }
  });

  function handleImportFile(file) {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    reader.onload = (evt) => {
      const text = evt.target.result;
      try {
        let parsed = [];

        if (fileName.endsWith('.vcf') || text.includes('BEGIN:VCARD')) {
          parsed = parseVCF(text);
        } else if (fileName.endsWith('.tsv') || text.includes('\t')) {
          const rows = parseCSV(text, '\t');
          parsed = convertCSVRowsToObjects(rows);
        } else {
          // Standard CSV
          const rows = parseCSV(text, ',');
          parsed = convertCSVRowsToObjects(rows);
        }

        if (parsed.length === 0) {
          showToast(t('toastImportEmpty'));
        } else {
          sheet.loadData(parsed);
          importModal.close();
          showToast(t('toastImportSuccess').replace('{count}', parsed.length).replace('{file}', file.name));
        }
      } catch (err) {
        console.error(err);
        showToast('Error parsing file: ' + err.message);
      }
      fileInput.value = '';
    };

    reader.readAsText(file);
  }

  function convertCSVRowsToObjects(matrix) {
    if (matrix.length < 2) return [];
    const headers = matrix[0].map(h => h.trim().toLowerCase());
    const results = [];

    // Header mapping dictionary (supports English and Arabic headers)
    const mapHeaderToKey = (h) => {
      if (h.includes('given') || h === 'first' || h.includes('first name') || h.includes('الاسم الأول') || h === 'الاسم') return 'firstName';
      if (h.includes('family') || h === 'last' || h.includes('last name') || h.includes('العائلة') || h.includes('القب')) return 'lastName';
      if (h.includes('org') || h.includes('company') || h.includes('شركة') || h.includes('مؤسسة')) return 'org';
      if (h.includes('title') || h.includes('role') || h.includes('position') || h.includes('وظيفة') || h.includes('المسمى')) return 'title';
      if (h.includes('mobile') || h.includes('جوال') || (h.includes('phone') && !h.includes('work') && !h.includes('business')) || (h.includes('هاتف') && !h.includes('عمل'))) return 'phoneCell';
      if (h.includes('work phone') || h.includes('business phone') || h.includes('هاتف العمل')) return 'phoneWork';
      if (h.includes('work email') || h.includes('e-mail 2') || h.includes('بريد العمل')) return 'emailWork';
      if (h.includes('email') || h.includes('e-mail') || h.includes('البريد')) return 'email';
      if (h.includes('street') || h.includes('address') || h.includes('شارع') || h.includes('عنوان')) return 'street';
      if (h.includes('city') || h.includes('مدينة')) return 'city';
      if (h.includes('state') || h.includes('region') || h.includes('منطقة') || h.includes('محافظة') || h.includes('ولاية')) return 'state';
      if (h.includes('zip') || h.includes('postal') || h.includes('بريدي')) return 'zip';
      if (h.includes('country') || h.includes('دولة') || h.includes('بلد')) return 'country';
      if (h.includes('web') || h.includes('url') || h.includes('موقع')) return 'website';
      if (h.includes('birth') || h.includes('ميلاد')) return 'birthday';
      if (h.includes('note') || h.includes('ملاحظ')) return 'notes';
      return h.replace(/[^a-z0-9]/g, '');
    };

    const keys = headers.map(mapHeaderToKey);

    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r];
      const contact = {};
      let hasData = false;

      for (let c = 0; c < headers.length; c++) {
        const val = (row[c] || '').trim();
        const key = keys[c];
        if (val && key) {
          contact[key] = val;
          hasData = true;
        }
      }

      if (hasData) {
        results.push(contact);
      }
    }

    return results;
  }

  // Set initial language
  applyLanguage(currentLang);
});

// Toast notification helper
function showToast(message, duration = 2800) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
