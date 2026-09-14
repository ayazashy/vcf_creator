/**
 * i18n.js
 * Comprehensive Arabic & English localization dictionary.
 * Arabic is the default language with full RTL support.
 */

export const COLUMN_DEFINITIONS = [
  { id: 'firstName', label_ar: 'الاسم الأول', label_en: 'First Name' },
  { id: 'lastName', label_ar: 'اسم العائلة', label_en: 'Last Name' },
  { id: 'org', label_ar: 'الشركة / المؤسسة', label_en: 'Organization' },
  { id: 'title', label_ar: 'المسمى الوظيفي', label_en: 'Job Title' },
  { id: 'phoneCell', label_ar: 'الجوال (المحمول)', label_en: 'Mobile Phone' },
  { id: 'phoneWork', label_ar: 'هاتف العمل', label_en: 'Work Phone' },
  { id: 'email', label_ar: 'البريد الإلكتروني', label_en: 'Personal Email' },
  { id: 'emailWork', label_ar: 'بريد العمل', label_en: 'Work Email' },
  { id: 'street', label_ar: 'العنوان / الشارع', label_en: 'Street Address' },
  { id: 'city', label_ar: 'المدينة', label_en: 'City' },
  { id: 'state', label_ar: 'المنطقة / المحافظة', label_en: 'State / Province' },
  { id: 'zip', label_ar: 'الرمز البريدي', label_en: 'Postal Code' },
  { id: 'country', label_ar: 'الدولة', label_en: 'Country' },
  { id: 'website', label_ar: 'الموقع الإلكتروني', label_en: 'Website' },
  { id: 'birthday', label_ar: 'تاريخ الميلاد (YYYY-MM-DD)', label_en: 'Birthday (YYYY-MM-DD)' },
  { id: 'notes', label_ar: 'ملاحظات', label_en: 'Notes' }
];

export function getLocalizedColumns(lang = 'ar') {
  return COLUMN_DEFINITIONS.map(col => ({
    id: col.id,
    label: lang === 'ar' ? col.label_ar : col.label_en
  }));
}

export const TRANSLATIONS = {
  ar: {
    appTitle: 'محرر جهات الاتصال وجداول VCF',
    statusReady: 'جاهز',
    langToggle: 'English (LTR)',
    btnAddRow: 'إضافة صف',
    btnHideEmpty: 'إخفاء الأعمدة الفارغة',
    btnUnhideEmpty: 'إظهار الأعمدة ({count})',
    btnRestoreHidden: 'إرجاع الأعمدة المخفية ({count})',
    btnSampleData: 'بيانات تجريبية',
    btnClearTable: 'مسح الكل',
    btnClearAllTop: 'مسح الكل',
    confirmClearSheet: 'هل أنت متأكد من مسح كافة البيانات في هذه الورقة؟',
    btnImport: 'استيراد',
    btnExport: 'تصدير جهات الاتصال',
    btnPasteToCell: 'لصق في الخلية',
    btnFormulaPaste: 'لصق',

    // Sheet / File Management
    btnNewSheet: '+ ورقة جديدة',
    sheetDefaultName: 'ورقة {num}',
    sheetPromptNew: 'أدخل اسم الورقة أو الملف الجديد:',
    sheetPromptRename: 'أدخل الاسم الجديد للورقة:',
    sheetConfirmDelete: 'هل أنت متأكد من حذف ورقة "{name}"؟',
    toastSheetCreated: 'تم إنشاء ورقة "{name}" بنجاح',
    toastSheetDeleted: 'تم حذف الورقة بنجاح',
    toastSheetRenamed: 'تمت إعادة تسمية الورقة بنجاح',
    autosavedBadge: 'تم الحفظ تلقائياً',

    cellCoordPrefix: 'الصف',
    cellCoordCol: 'العمود',
    cellCoordRange: '{rows} صفوف × {cols} أعمدة ({cells} خلية محددة)',
    cellPlaceholderSingle: 'محتوى الخلية...',
    cellPlaceholderMulti: '{cells} خلية محددة (اضغط Delete للمسح، Ctrl+C للنسخ)',
    statContacts: 'جهات الاتصال:',
    statActiveCols: 'الأعمدة النشطة:',
    statEmptyCols: 'الأعمدة الفارغة:',
    footerShortcuts: 'التحديد: نقر وسحب / لمس مطول • التعديل: نقر مزدوج • اللصق: زر لصق أو Ctrl+V • النسخ: Ctrl+C • التراجع: Ctrl+Z',
    footerStatus: '{rows} صف، {cols} عمود ({empty} فارغ)',

    // Drawer & Sidebar Navigation
    btnMenuToggle: 'الأدوات',
    drawerTitle: 'لوحة الأدوات والخيارات',
    lblSecSheets: 'أوراق وملفات العمل',
    lblSecData: 'الحافظة والبيانات',
    lblSecSheet: 'إدارة الجدول والأعمدة',
    lblSecActions: 'استيراد وتصدير',
    lblSecLang: 'اللغة والواجهة',
    drawerQuickPasteDesc: 'لصق نصوص واتساب وتوزيعها تلقائياً',
    drawerAddRowDesc: 'إدراج صف فارغ في نهاية الجدول',
    drawerHideEmptyDesc: 'طي الحقول التي لا تحتوي على بيانات',
    drawerImportDesc: 'يدعم VCF 2.1/3.0/4.0, CSV, TSV',
    drawerExportDesc: 'VCF (UTF-8/QP), Google CSV, Outlook, JSON',
    drawerSampleDesc: 'نماذج جهات اتصال واقعية للتجربة',
    drawerClearDesc: 'إعادة تعيين وبدء جدول فارغ جديد',
    drawerLangDesc: 'Switch interface language & direction',

    // Floating Cell Action Toolbar
    cellMenuPaste: 'لصق',
    cellMenuCopy: 'نسخ',
    cellMenuEdit: 'تعديل',
    cellMenuClear: 'مسح',
    cellMenuDeleteRow: 'حذف الصف',

    // Quick Paste Modal
    quickPasteTitle: 'لصق واستخراج سريع للبيانات المنسوخة',
    quickPasteDesc: 'الصق أي نص يحتوي على أسماء وأرقام (من إكسل، جداول جوجل، واتساب، أو الملاحظات) وسيقوم النظام باستخراجها وتوحيدها وتوزيعها تلقائياً.',
    quickPastePlaceholder: 'الصق النص المنسوخ هنا...\nمثال 1 (إكسل): الاسم [تاب/مسافة] 0501234567\nمثال 2 (واتساب): فلان - 0555555555\nمثال 3 (هاتف أرضي): الشركة 0114567890',
    quickPasteOptAutoStd: 'توحيد أرقام الهواتف السعودية تلقائياً (+966)',
    quickPasteOptReplace: 'استبدال الجدول بالكامل بهذه البيانات',
    quickPasteOptAppend: 'إضافة البيانات المستخرجة إلى الجدول الحالي',
    quickPasteBtnExtract: 'استخراج ومعاينة',
    quickPasteBtnApply: 'تطبيق وإدراج في الجدول',
    quickPastePreviewTitle: 'المعاينة المستخرجة',
    quickPasteCount: 'تم استخراج {count} جهة اتصال جاهزة',
    quickPasteEmpty: 'الصق نصاً واضغط على استخراج لرؤية النتيجة',
    mfabExport: 'تصدير',

    // Export Modal
    exportModalTitle: 'تصدير بيانات جهات الاتصال',
    exportDeviceRecommended: 'الصيغة المثالية لجهازك ({device}) محددة تلقائياً',
    exportFormatLabel: 'صيغة التصدير',
    exportFilenameLabel: 'اسم الملف',
    exportPreviewHeader: 'معاينة مباشرة للبيانات (تجاهل الحقول الفارغة تلقائياً)',
    exportCharsCount: '{lines} سطر • {chars} حرف',
    exportBtnCopy: 'نسخ للحافظة',
    exportBtnDownload: 'تنزيل الملف',
    exportShareBtn: 'مشاركة الملف',
    exportOtherFormatsSummary: 'تصدير بصيغ أخرى (Google CSV, Excel, Outlook, JSON, TSV)...',
    exportIosTip: 'لمستخدمي الآيفون: اضغط «مشاركة الملف» لإرساله مباشرة عبر واتساب أو حفظه في تطبيق «الملفات»، أو «تنزيل» لحفظه في التنزيلات.',
    exportQpOption: 'ترميز الحروف العربية وغير اللاتينية بصيغة Quoted-Printable (=D9=8A... للهواتف القديمة وOutlook وبلوتوث السيارات)',

    // Import Modal
    importModalTitle: 'استيراد ملف جهات اتصال',
    importDropText: 'اضغط أو اسحب ملفاً هنا للاستيراد',
    importDropHint: 'يدعم صيغ .vcf (vCard) و .csv و .tsv',
    importCancel: 'إلغاء',

    // Column Menu Prompt
    colMenuPrompt: 'العمود: "{label}"\nاكتب الرقم لتنفيذ الإجراء:\n1: إخفاء هذا العمود\n2: تفريغ كافة قيم هذا العمود\n3: إلغاء',
    colClearConfirm: 'هل أنت متأكد من تفريغ جميع القيم في عمود "{label}"؟',

    // Toasts
    toastRowAdded: 'تمت إضافة صف جديد',
    toastSampleLoaded: 'تم تحميل 5 جهات اتصال تجريبية',
    toastReset: 'تمت إعادة ضبط الجدول',
    toastNothingToExport: 'لا توجد بيانات صالحة للتصدير',
    toastNothingToCopy: 'لا يوجد محتوى للنسخ',
    toastCopied: 'تم نسخ محتوى التصدير إلى الحافظة',
    toastCellsCopied: 'تم نسخ {count} خلية إلى الحافظة',
    toastCellCopied: 'تم نسخ الخلية إلى الحافظة',
    toastDownloaded: 'تم تنزيل {file}',
    toastHiddenEmpty: 'تم إخفاء {count} عمود فارغ',
    toastUnhiddenEmpty: 'تمت استعادة إظهار جميع الأعمدة',
    toastNoEmpty: 'لا توجد أعمدة فارغة تماماً',
    toastImportSuccess: 'تم استيراد {count} جهة اتصال بنجاح من {file}',
    toastImportEmpty: 'لم يتم العثور على جهات اتصال صالحة في الملف',
    toastQuickPasteSuccess: 'تم إدراج {count} جهة اتصال في الجدول بنجاح',
    toastQuickPasteNoContacts: 'لم يتم العثور على أسماء أو أرقام صالحة في النص الملصق'
  },
  en: {
    appTitle: 'Contacts Sheet & VCF Creator',
    statusReady: 'Ready',
    langToggle: 'العربية (RTL)',
    btnAddRow: 'Add Row',
    btnHideEmpty: 'Hide Empty Cols',
    btnUnhideEmpty: 'Unhide Empty ({count})',
    btnRestoreHidden: 'Restore Hidden ({count})',
    btnSampleData: 'Load Sample Data',
    btnClearTable: 'Clear',
    btnClearAllTop: 'Clear All',
    confirmClearSheet: 'Are you sure you want to clear all contacts in this sheet?',
    btnImport: 'Import',
    btnExport: 'Export Contacts',
    btnPasteToCell: 'Paste to Cell',
    btnFormulaPaste: 'Paste',

    // Sheet / File Management
    btnNewSheet: '+ New Sheet',
    sheetDefaultName: 'Sheet {num}',
    sheetPromptNew: 'Enter new sheet or file name:',
    sheetPromptRename: 'Enter new sheet name:',
    sheetConfirmDelete: 'Are you sure you want to delete sheet "{name}"?',
    toastSheetCreated: 'Sheet "{name}" created',
    toastSheetDeleted: 'Sheet deleted',
    toastSheetRenamed: 'Sheet renamed',
    autosavedBadge: 'Autosaved locally',

    cellCoordPrefix: 'Row',
    cellCoordCol: 'Col',
    cellCoordRange: '{rows}R × {cols}C ({cells} cells selected)',
    cellPlaceholderSingle: 'Cell content...',
    cellPlaceholderMulti: '{cells} cells selected (Press Delete to clear, Ctrl+C to copy)',
    statContacts: 'Contacts:',
    statActiveCols: 'Active Columns:',
    statEmptyCols: 'Empty Columns:',
    footerShortcuts: 'Select: Click & Drag / Touch Hold • Edit: Double-Click • Paste: Paste Button or Ctrl+V • Copy: Ctrl+C • Undo: Ctrl+Z',
    footerStatus: '{rows} rows, {cols} columns ({empty} empty)',

    // Drawer & Sidebar Navigation
    btnMenuToggle: 'Tools',
    drawerTitle: 'Tools & Actions Drawer',
    lblSecSheets: 'Sheets & Files',
    lblSecData: 'Clipboard & Data',
    lblSecSheet: 'Sheet & Columns',
    lblSecActions: 'Files & Export',
    lblSecLang: 'Language & Settings',
    drawerQuickPasteDesc: 'Extract WhatsApp/Notes contacts automatically',
    drawerAddRowDesc: 'Insert a new empty row at the bottom',
    drawerHideEmptyDesc: 'Collapse unused empty columns',
    drawerImportDesc: 'Supports VCF 2.1/3.0/4.0, CSV, TSV',
    drawerExportDesc: 'VCF (UTF-8/QP), Google CSV, Outlook, JSON',
    drawerSampleDesc: 'Load realistic bilingual sample contacts',
    drawerClearDesc: 'Reset spreadsheet and start clean',
    drawerLangDesc: 'تبديل واجهة التطبيق إلى اللغة العربية واليمين لليسار',

    // Floating Cell Action Toolbar
    cellMenuPaste: 'Paste',
    cellMenuCopy: 'Copy',
    cellMenuEdit: 'Edit',
    cellMenuClear: 'Clear',
    cellMenuDeleteRow: 'Delete Row',

    // Quick Paste Modal
    quickPasteTitle: 'Quick Paste & Smart Extract Copied Data',
    quickPasteDesc: 'Paste any text containing names and phone numbers (from Excel, Google Sheets, WhatsApp, or Notes) and it will be extracted, standardized, and placed into the sheet.',
    quickPastePlaceholder: 'Paste copied text here...\nExample 1 (Excel): Name [Tab/Space] 0501234567\nExample 2 (WhatsApp): Name - 0555555555\nExample 3 (Landline): Company 0114567890',
    quickPasteOptAutoStd: 'Auto-standardize Saudi phone numbers (+966)',
    quickPasteOptReplace: 'Replace current sheet data with extracted contacts',
    quickPasteOptAppend: 'Append extracted contacts to current sheet data',
    quickPasteBtnExtract: 'Extract & Preview',
    quickPasteBtnApply: 'Apply & Insert to Sheet',
    quickPastePreviewTitle: 'Extracted Preview',
    quickPasteCount: 'Extracted {count} ready contacts',
    quickPasteEmpty: 'Paste text and tap Extract to see preview',
    mfabExport: 'Export',

    // Export Modal
    exportModalTitle: 'Export Contacts Dataset',
    exportDeviceRecommended: 'Optimized format for your device ({device}) automatically selected',
    exportFormatLabel: 'Export Format',
    exportFilenameLabel: 'Filename',
    exportPreviewHeader: 'Live Generated Preview (Empty fields strictly excluded)',
    exportCharsCount: '{lines} lines • {chars} characters',
    exportBtnCopy: 'Copy to Clipboard',
    exportBtnDownload: 'Download File',
    exportShareBtn: 'Share File',
    exportOtherFormatsSummary: 'Export in other formats (Google CSV, Excel, Outlook, JSON, TSV)...',
    exportIosTip: 'Tip for iPhone: Tap "Share File" to send directly via WhatsApp or Save to Files app, or tap "Download" to save to Downloads.',
    exportQpOption: 'Encode Arabic & non-ASCII with Quoted-Printable (=D9=8A... for older phones, Car Bluetooth & Outlook)',

    // Import Modal
    importModalTitle: 'Import Contacts',
    importDropText: 'Click or drag a file to import',
    importDropHint: 'Supports .vcf (vCard), .csv, .tsv',
    importCancel: 'Cancel',

    // Column Menu Prompt
    colMenuPrompt: 'Column: "{label}"\nType number to select action:\n1: Hide this column\n2: Clear all values in column\n3: Cancel',
    colClearConfirm: 'Clear all values under "{label}"?',

    // Toasts
    toastRowAdded: 'Row added',
    toastSampleLoaded: 'Loaded 5 sample contacts',
    toastReset: 'Spreadsheet reset',
    toastNothingToExport: 'No contacts to export',
    toastNothingToCopy: 'Nothing to copy',
    toastCopied: 'Copied exported data to clipboard',
    toastCellsCopied: 'Copied {count} cells to clipboard',
    toastCellCopied: 'Cell copied',
    toastDownloaded: 'Downloaded {file}',
    toastHiddenEmpty: 'Hidden {count} empty column(s)',
    toastUnhiddenEmpty: 'Restored all columns',
    toastNoEmpty: 'No completely empty columns found',
    toastImportSuccess: 'Successfully imported {count} contacts from {file}',
    toastImportEmpty: 'No valid contact entries found in file',
    toastQuickPasteSuccess: 'Successfully inserted {count} contacts into sheet',
    toastQuickPasteNoContacts: 'No valid names or phone numbers found in pasted text'
  }
};
