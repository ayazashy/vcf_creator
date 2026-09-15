# Contacts Sheet & VCF Creator (محرر جهات الاتصال وجداول VCF)

A fast, lightweight, framework-free web platform designed to create, edit, and organize tabular contact datasets like a spreadsheet, with instant one-click export to **VCF (vCard 2.1, 3.0, 4.0)**, **Google Contacts CSV**, **Outlook CSV**, **Standard CSV**, **TSV**, and **JSON**.
## 🟢 available at https://ayazashy.github.io/vcf_creator :)

Built specifically to solve contact formatting, empty field cleanup, and non-ASCII/Arabic encoding compatibility across modern and legacy devices.

---

## Key Features

### 1. Spreadsheet Data Grid (Lite Excel / Google Sheets)
- **Click & Drag Range Selection**: Press and drag across cells to select any rectangular range, with active boundary borders and corner selection handles.
- **Direct Inline Editing**: Double-click or start typing immediately to edit cell values.
- **Keyboard Navigation**: Full arrow keys navigation, `Tab` / `Shift+Tab`, `Enter` to commit and move down, and `Escape` to cancel.
- **Clipboard Integration**:
  - `Ctrl/Cmd + C`: Copies selected rectangular cell range as tab-separated values (TSV).
  - `Ctrl/Cmd + V`: Pastes multi-row, multi-column blocks copied directly from Google Sheets or Excel.
- **Undo / Redo**: Full `Ctrl/Cmd + Z` and `Ctrl/Cmd + Y` history stack.
- **Row & Column Management**: Insert rows, duplicate rows, delete rows, add custom columns, and rename columns.

### 2. Native Arabic Default & Full RTL Support
- **Arabic by Default**: The interface loads in Arabic with native Right-to-Left (`dir="rtl"`) layout.
- **Dynamic RTL / LTR Language Switcher**: One-click toggle between Arabic (RTL) and English (LTR) with preference saved in `localStorage`.
- **Bidirectional Text Flow**: Cells use `unicode-bidi: plaintext` and `direction: auto`, ensuring Arabic names and addresses flow right-to-left while phone numbers, emails, and English text remain left-to-right.

### 3. Arabic & Non-ASCII vCard Quoted-Printable Encoding (`=D9=8A...`)
Older contact readers (Microsoft Outlook, feature phones, car Bluetooth infotainment head units, and SIM card managers) fail to parse raw UTF-8 Arabic text unless encoded in Quoted-Printable format according to the vCard 2.1 / MIME specification:
- **Quoted-Printable Export**: Non-ASCII characters are converted to UTF-8 byte sequences (e.g. Arabic letter **ي** is encoded as `=D9=8A`).
  ```vcard
  BEGIN:VCARD
  VERSION:3.0
  FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D9=8A=D8=B9=D9=82=D9=88=D8=A8 =D8=A7=D9=84=D8=B9=D8=AA=D9=8A=D8=A8=D9=8A
  N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D8=A7=D9=84=D8=B9=D8=AA=D9=8A=D8=A8=D9=8A;=D9=8A=D8=B9=D9=82=D9=88=D8=A8;;;
  ORG;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D8=B4=D8=B1=D9=83=D8=A9 =D8=A7=D9=84=D8=AA=D9=82=D9=86=D9=8A=D8=A9
  TEL;TYPE=CELL,VOICE:+966501234567
  END:VCARD
  ```
- **Modern UTF-8 Export**: Direct UTF-8 for Apple iOS (iPhone/iPad), macOS Contacts, Android, and Google Contacts.
- **Two-Way Lossless Import**: Importing `.vcf` files with `=D9=8A...` automatically decodes them back to readable Arabic text in the spreadsheet.

### 4. Microsoft Excel Arabic CSV Compatibility (UTF-8 BOM)
- Pre-pends the UTF-8 Byte Order Mark (`\uFEFF`) to exported CSV and TSV files. This prevents Microsoft Excel from opening Arabic datasets as garbled characters (mojibake).

### 5. Smart Empty Field & Column Pruning
- **Zero Empty Fields in Export**: Empty contact fields (`TEL:`, `EMAIL:`, `ADR:`, `NOTE:`, `ORG:`) are never emitted in exported files.
- **Hide Empty Columns**: 1-click toggle to temporarily collapse any columns with 0 entries across all rows.
- **Purge Empty Columns**: Permanently removes unused columns across the dataset before export.

### 6. Mobile Phone UX & Tools Sidebar Drawer
- **Unified Spreadsheet Viewport**: The core tabular grid is identical across desktop and smartphones with smooth native touch scrolling.
- **Slide-Out Sidebar Drawer (`الأدوات`)**: All management tools (column customization, hiding/purging empty fields, sample datasets, reset, and language switcher) are accessible via a clean, slide-out sidebar drawer.
- **1-Tap Quick Actions**: Header bar includes direct 1-tap buttons for adding rows (`إضافة صف`), clearing the sheet (`مسح الكل`), and exporting (`تصدير`), with immediate cell paste right in the formula bar.
- **Touch Selection & Action Menu**: Long-press on any cell to open floating options (Copy, Paste, Clear, Delete Row).

### 7. Quick Paste & Smart Extraction (Mobile & Spreadsheet Assistant)
- Mobile users frequently copy columns or chat lists from Google Sheets, Excel, WhatsApp, or Notes.
- **Smart Freeform & Tab Extractor**: Automatically detects names, mobile numbers, landlines, and emails regardless of format (tabs, hyphens, colons, or multi-line pairs).
- **Real-Time Extracted Preview**: Shows instant preview of parsed contacts with Replace or Append options.

### 8. Saudi Phone Number Standardization (+966)
- **Automatic Default**: Any pasted or edited phone number is standardized to Saudi format by default:
  - **Mobile**: `05XXXXXXXX` (10 digits) or `5XXXXXXXX` (9 digits) -> `+9665XXXXXXXX`.
  - **Landlines**: `011` (Riyadh), `012` (Makkah / Jeddah), `013` (Eastern), `014` (Madinah / Tabuk), `016` (Qassim), `017` (South) -> `+9661XXXXXXXX`.
  - **Unified & Toll-Free**: `9200XXXXX` -> `+9669200XXXXX`, `800...` supported.
  - **Eastern Arabic Numerals**: Converts `٠١٢٣٤٥٦٧٨٩` to standard digits automatically.
  - **International Preservation**: Preserves international numbers starting with `+` (e.g. `+971...`, `+1...`).
  - **Bulk Standardize**: 1-click button (`⚡ +966`) to clean and unify the entire dataset at once.

---

## File Architecture

Zero framework overhead, zero `node_modules`, and no compilation step required:

```
vcf_creator/
├── index.html       # Semantic HTML5 layout with Arabic RTL default & modals
├── style.css        # Precision workbench design (System fonts, no Inter, no gradients, <=6px radius)
├── sheet.js         # Spreadsheet grid engine (selection, editing, clipboard, undo/redo)
├── converters.js    # vCard 2.1/3.0/4.0, Quoted-Printable, Google CSV, Outlook CSV, TSV, JSON
├── i18n.js          # Arabic and English localization dictionary
├── app.js           # Main controller, event wiring, demo contacts, export/import
└── README.md        # Documentation
```

---

## Quick Start / Running Locally

Since this application uses vanilla web standards, it can be run using any static file server:

### Using Python
```bash
python3 -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Using Node / npx
```bash
npx serve .
```

---

## Keyboard & Mouse Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **Select Range** | Click & Drag across cells or `Shift + Arrow keys` |
| **Extend Selection** | `Shift + Click` on target cell |
| **Edit Cell** | `Double-Click` or start typing |
| **Commit Edit** | `Enter` (moves down; auto-appends row on last line) |
| **Navigate Cells** | `Arrow keys` / `Tab` / `Shift + Tab` |
| **Copy Selected Range** | `Ctrl + C` / `Cmd + C` |
| **Paste from Sheets / Excel** | `Ctrl + V` / `Cmd + V` |
| **Clear Selection** | `Delete` or `Backspace` |
| **Undo / Redo** | `Ctrl + Z` / `Ctrl + Y` (`Cmd + Z` / `Cmd + Shift + Z` on Mac) |
| **Cancel Edit / Collapse Range** | `Escape` |

---

## Supported Export Formats

1. **vCard 3.0 (UTF-8)** - Standard for iPhone, iPad, macOS, and modern Android.
2. **vCard (Quoted-Printable `=D9=8A...`)** - For Microsoft Outlook, older Android, car Bluetooth systems, and feature phones.
3. **vCard 4.0** - Modern RFC 6350 standard.
4. **Google Contacts CSV** - Formatted with official Google Contacts import headers.
5. **Outlook Contacts CSV** - Formatted for Microsoft Outlook / Office 365.
6. **Standard CSV** - RFC 4180 compliant with UTF-8 BOM.
7. **TSV (Tab-Separated)** - Easy copy-paste format with UTF-8 BOM.
8. **JSON** - Clean structured array of contact objects omitting empty keys.

---

## License

MIT License. Open source and free to use.
