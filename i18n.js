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
    btnAddCol: 'إضافة عمود',
    btnHideEmpty: 'إخفاء الأعمدة الفارغة',
    btnUnhideEmpty: 'إظهار الأعمدة ({count})',
    btnPurgeEmpty: 'حذف الأعمدة الفارغة',
    btnSampleData: 'بيانات تجريبية',
    btnClearTable: 'مسح الكل',
    btnImport: 'استيراد',
    btnExport: 'تصدير جهات الاتصال',
    btnPasteToCell: 'لصق في الخلية 📋',
    btnStandardizePhones: 'توحيد الأرقام (+966) ⚡',

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
    btnMenuToggle: 'الأدوات ☰',
    drawerTitle: 'لوحة الأدوات والخيارات',
    lblSecData: '📋 الحافظة والبيانات',
    lblSecSheet: '📊 إدارة الجدول والأعمدة',
    lblSecActions: '📁 استيراد وتصدير',
    lblSecLang: '🌐 اللغة والواجهة',
    drawerPasteLabel: 'لصق في الخلية النشطة',
    drawerPasteDesc: 'لصق مباشر من إكسل أو الحافظة',
    drawerQuickPasteDesc: 'لصق نصوص واتساب وتوزيعها تلقائياً',
    drawerStdDesc: 'تعديل 05.. و 5.. و 011.. إلى الصيغة الدولية (+966)',
    drawerAddRowDesc: 'إدراج صف فارغ في نهاية الجدول',
    drawerAddColDesc: 'إنشاء حقل جديد (مثل: القسم، اللقب)',
    drawerHideEmptyDesc: 'طي الحقول التي لا تحتوي على بيانات',
    drawerPurgeEmptyDesc: 'إزالة الحقول غير المستخدمة نهائياً',
    drawerImportDesc: 'يدعم VCF 2.1/3.0/4.0, CSV, TSV',
    drawerExportDesc: 'VCF (UTF-8/QP), Google CSV, Outlook, JSON',
    drawerSampleDesc: 'نماذج جهات اتصال واقعية للتجربة',
    drawerClearDesc: 'إعادة تعيين وبدء جدول فارغ جديد',
    drawerLangDesc: 'Switch interface language & direction',

    // Floating Cell Action Toolbar
    cellMenuPaste: 'لصق 📋',
    cellMenuCopy: 'نسخ 📄',
    cellMenuEdit: 'تعديل ✏️',
    cellMenuStd: '+966 ⚡',
    cellMenuClear: 'مسح 🗑️',
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
    mfabStd: '+966',
    mfabExport: 'تصدير',

    // Export Modal
    exportModalTitle: 'تصدير بيانات جهات الاتصال',
    exportFormatLabel: 'صيغة التصدير',
    exportFilenameLabel: 'اسم الملف',
    exportPreviewHeader: 'معاينة مباشرة للبيانات (تجاهل الحقول الفارغة تلقائياً)',
    exportCharsCount: '{lines} سطر • {chars} حرف',
    exportBtnCopy: 'نسخ للحافظة',
    exportBtnDownload: 'تنزيل الملف',
    exportQpOption: 'ترميز الحروف العربية وغير اللاتينية بصيغة Quoted-Printable (=D9=8A... للهواتف القديمة وOutlook وبلوتوث السيارات)',

    // Import Modal
    importModalTitle: 'استيراد ملف جهات اتصال',
    importDropText: 'اضغط أو اسحب ملفاً هنا للاستيراد',
    importDropHint: 'يدعم صيغ .vcf (vCard) و .csv و .tsv',
    importCancel: 'إلغاء',

    // Add Column Modal
    colModalTitle: 'إضافة عمود جديد',
    colModalLabel: 'اسم العمود',
    colModalPlaceholder: 'مثال: اللقب، القسم، تيليجرام',
    colModalCancel: 'إلغاء',
    colModalConfirm: 'إنشاء العمود',

    // Column Menu Prompt
    colMenuPrompt: 'العمود: "{label}"\nاكتب الرقم لتنفيذ الإجراء:\n1: إعادة تسمية العمود\n2: تفريغ قيم العمود\n3: حذف العمود نهائياً\n4: إلغاء',
    colRenamePrompt: 'أدخل الاسم الجديد للعمود:',
    colClearConfirm: 'هل أنت متأكد من تفريغ جميع القيم في عمود "{label}"؟',
    colDeleteConfirm: 'هل أنت متأكد من حذف عمود "{label}" نهائياً؟',

    // Toasts
    toastRowAdded: 'تمت إضافة صف جديد',
    toastColCreated: 'تم إنشاء عمود "{name}" بنجاح',
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
    toastPurgedEmpty: 'تم حذف {count} عمود فارغ نهائياً',
    toastNoEmpty: 'لا توجد أعمدة فارغة تماماً',
    toastImportSuccess: 'تم استيراد {count} جهة اتصال بنجاح من {file}',
    toastImportEmpty: 'لم يتم العثور على جهات اتصال صالحة في الملف',
    toastPhonesStandardized: 'تم توحيد {count} رقم هاتف سعودي بنجاح (+966)',
    toastNoPhonesNeedStandardizing: 'جميع أرقام الهواتف مطابقة وموحدة بالفعل',
    toastQuickPasteSuccess: 'تم إدراج {count} جهة اتصال في الجدول بنجاح',
    toastQuickPasteNoContacts: 'لم يتم العثور على أسماء أو أرقام صالحة في النص الملصق'
  },
  en: {
    appTitle: 'Contacts Sheet & VCF Creator',
    statusReady: 'Ready',
    langToggle: 'العربية (RTL)',
    btnAddRow: 'Add Row',
    btnAddCol: 'Add Column',
    btnHideEmpty: 'Hide Empty Cols',
    btnUnhideEmpty: 'Unhide Empty ({count})',
    btnPurgeEmpty: 'Purge Empty Cols',
    btnSampleData: 'Load Sample Data',
    btnClearTable: 'Clear',
    btnImport: 'Import',
    btnExport: 'Export Contacts',
    btnPasteToCell: 'Paste to Cell 📋',
    btnStandardizePhones: 'Standardize Phones (+966) ⚡',

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
    btnMenuToggle: 'Tools ☰',
    drawerTitle: 'Tools & Actions Drawer',
    lblSecData: '📋 Clipboard & Data',
    lblSecSheet: '📊 Sheet & Columns',
    lblSecActions: '📁 Files & Export',
    lblSecLang: '🌐 Language & Settings',
    drawerPasteLabel: 'Paste to Active Cell',
    drawerPasteDesc: 'Direct paste from Excel or system clipboard',
    drawerQuickPasteDesc: 'Extract WhatsApp/Notes contacts automatically',
    drawerStdDesc: 'Standardize 05.., 5.., 011.. to (+966)',
    drawerAddRowDesc: 'Insert a new empty row at the bottom',
    drawerAddColDesc: 'Create a custom field (e.g. Nickname, Dept)',
    drawerHideEmptyDesc: 'Collapse unused empty columns',
    drawerPurgeEmptyDesc: 'Permanently remove empty columns',
    drawerImportDesc: 'Supports VCF 2.1/3.0/4.0, CSV, TSV',
    drawerExportDesc: 'VCF (UTF-8/QP), Google CSV, Outlook, JSON',
    drawerSampleDesc: 'Load realistic bilingual sample contacts',
    drawerClearDesc: 'Reset spreadsheet and start clean',
    drawerLangDesc: 'تبديل واجهة التطبيق إلى اللغة العربية واليمين لليسار',

    // Floating Cell Action Toolbar
    cellMenuPaste: 'Paste 📋',
    cellMenuCopy: 'Copy 📄',
    cellMenuEdit: 'Edit ✏️',
    cellMenuStd: '+966 ⚡',
    cellMenuClear: 'Clear 🗑️',
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
    mfabStd: '+966',
    mfabExport: 'Export',

    // Export Modal
    exportModalTitle: 'Export Contacts Dataset',
    exportFormatLabel: 'Export Format',
    exportFilenameLabel: 'Filename',
    exportPreviewHeader: 'Live Generated Preview (Empty fields strictly excluded)',
    exportCharsCount: '{lines} lines • {chars} characters',
    exportBtnCopy: 'Copy to Clipboard',
    exportBtnDownload: 'Download File',
    exportQpOption: 'Encode Arabic & non-ASCII with Quoted-Printable (=D9=8A... for older phones, Car Bluetooth & Outlook)',

    // Import Modal
    importModalTitle: 'Import Contacts',
    importDropText: 'Click or drag a file to import',
    importDropHint: 'Supports .vcf (vCard), .csv, .tsv',
    importCancel: 'Cancel',

    // Add Column Modal
    colModalTitle: 'Add Custom Column',
    colModalLabel: 'Column Label',
    colModalPlaceholder: 'e.g. Nickname, Department, Telegram',
    colModalCancel: 'Cancel',
    colModalConfirm: 'Create Column',

    // Column Menu Prompt
    colMenuPrompt: 'Column: "{label}"\nType number to select action:\n1: Rename Column\n2: Clear All Values in Column\n3: Delete Column\n4: Cancel',
    colRenamePrompt: 'Enter new column label:',
    colClearConfirm: 'Clear all values under "{label}"?',
    colDeleteConfirm: 'Delete column "{label}"?',

    // Toasts
    toastRowAdded: 'Row added',
    toastColCreated: 'Column "{name}" created',
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
    toastPurgedEmpty: 'Purged {count} empty column(s)',
    toastNoEmpty: 'No completely empty columns found',
    toastImportSuccess: 'Successfully imported {count} contacts from {file}',
    toastImportEmpty: 'No valid contact entries found in file',
    toastPhonesStandardized: 'Standardized {count} Saudi phone numbers (+966)',
    toastNoPhonesNeedStandardizing: 'All phone numbers are already standardized',
    toastQuickPasteSuccess: 'Successfully inserted {count} contacts into sheet',
    toastQuickPasteNoContacts: 'No valid names or phone numbers found in pasted text'
  }
};
