/**
 * sheet.js
 * High-performance spreadsheet grid engine for tabular contact data.
 * Pure Vanilla JS, zero dependencies.
 *
 * Supports:
 * - Table View & Mobile-Friendly Card View
 * - Multi-cell range selection by click & drag (mouse down & move)
 * - Shift + Click and Shift + Arrow keys range selection
 * - Copy / Cut / Paste across selected cell ranges
 * - Automatic Saudi phone normalization (+966 for 05..., 5..., 011..., 9200...)
 * - Inline editing, keyboard navigation, undo/redo
 * - Smart empty column pruning and hiding
 */

import { DEFAULT_COLUMNS, getLocalizedColumns, standardizeSaudiPhone } from './converters.js';
import { TRANSLATIONS } from './i18n.js';

export class ContactSheet {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = options;
    this.lang = options.lang || 'ar';

    this.columns = getLocalizedColumns(this.lang);
    this.rows = [];
    this.hiddenColumnIds = new Set();

    // Selection state: Anchor (start) and Focus (current drag point)
    this.selectionAnchor = { row: 0, col: 0 };
    this.selectionFocus = { row: 0, col: 0 };
    this.activeRowIdx = 0;
    this.activeColIdx = 0;
    this.isSelecting = false;
    this.isSelectingRowHeaders = false;
    this.isSelectingColHeaders = false;
    this.isEditing = false;
    this.selectedRowIndices = new Set();

    // History for Undo/Redo
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;

    // Callbacks
    this.onSelectionChange = options.onSelectionChange || (() => {});
    this.onDataChange = options.onDataChange || (() => {});
    this.onToast = options.onToast || (() => {});
    this.onEditContact = options.onEditContact || (() => {});

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    const t = TRANSLATIONS[this.lang] || TRANSLATIONS.ar;
    this.container.innerHTML = `
      <div class="sheet-scroll-pane" id="sheet-scroll-pane" tabindex="0">
        <table class="sheet-table" id="sheet-table">
          <thead id="sheet-thead"></thead>
          <tbody id="sheet-tbody"></tbody>
        </table>
        <div class="cell-floating-toolbar" id="cell-floating-toolbar" style="display: none;">
          <button type="button" class="cft-btn cft-paste" data-action="cell-paste" title="لصق البيانات من الحافظة في هذه الخلية">
            📋 <span class="cft-label">${t.cellMenuPaste || 'لصق'}</span>
          </button>
          <button type="button" class="cft-btn" data-action="cell-copy" title="نسخ محتوى الخلية">
            📄 <span class="cft-label">${t.cellMenuCopy || 'نسخ'}</span>
          </button>
          <button type="button" class="cft-btn" data-action="cell-edit" title="تعديل الخلية">
            ✏️ <span class="cft-label">${t.cellMenuEdit || 'تعديل'}</span>
          </button>
          <button type="button" class="cft-btn" data-action="cell-std" title="توحيد الرقم السعودي (+966)">
            ⚡ <span class="cft-label">+966</span>
          </button>
          <button type="button" class="cft-btn cft-danger" data-action="cell-clear" title="مسح محتوى الخلية">
            🗑️ <span class="cft-label">${t.cellMenuClear || 'مسح'}</span>
          </button>
        </div>
      </div>
    `;

    this.scrollPane = this.container.querySelector('#sheet-scroll-pane');
    this.table = this.container.querySelector('#sheet-table');
    this.thead = this.container.querySelector('#sheet-thead');
    this.tbody = this.container.querySelector('#sheet-tbody');
    this.floatingToolbar = this.container.querySelector('#cell-floating-toolbar');
  }

  /**
   * Loads initial rows or sets default empty rows.
   */
  loadData(contacts = []) {
    if (contacts.length === 0) {
      // Create 8 empty rows for quick entry
      this.rows = Array.from({ length: 8 }, () => this.createEmptyRow());
    } else {
      this.rows = contacts.map(c => {
        const row = { ...c, _id: c._id || this.generateId() };
        if (row.phoneCell) row.phoneCell = standardizeSaudiPhone(row.phoneCell);
        if (row.phoneWork) row.phoneWork = standardizeSaudiPhone(row.phoneWork);
        return row;
      });
    }

    // Check if imported contacts have any unknown columns and add them
    const existingColIds = new Set(this.columns.map(c => c.id));
    for (const row of this.rows) {
      for (const key of Object.keys(row)) {
        if (!key.startsWith('_') && !existingColIds.has(key)) {
          this.columns.push({
            id: key,
            label: this.formatColumnLabel(key)
          });
          existingColIds.add(key);
        }
      }
    }

    this.selectionAnchor = { row: 0, col: 0 };
    this.selectionFocus = { row: 0, col: 0 };
    this.activeRowIdx = 0;
    this.activeColIdx = 0;
    this.selectedRowIndices.clear();
    this.saveHistory('Load Data');
    this.render();
  }

  createEmptyRow() {
    const row = { _id: this.generateId() };
    for (const col of this.columns) {
      row[col.id] = '';
    }
    return row;
  }

  generateId() {
    return 'r_' + Math.random().toString(36).substring(2, 9);
  }

  formatColumnLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Visible columns excluding hidden ones
   */
  getVisibleColumns() {
    return this.columns.filter(c => !this.hiddenColumnIds.has(c.id));
  }

  /**
   * Computes normalized bounding rectangle of the current selection.
   */
  getSelectionRange() {
    const minRow = Math.min(this.selectionAnchor.row, this.selectionFocus.row);
    const maxRow = Math.max(this.selectionAnchor.row, this.selectionFocus.row);
    const minCol = Math.min(this.selectionAnchor.col, this.selectionFocus.col);
    const maxCol = Math.max(this.selectionAnchor.col, this.selectionFocus.col);

    const rowCount = maxRow - minRow + 1;
    const colCount = maxCol - minCol + 1;

    return {
      minRow,
      maxRow,
      minCol,
      maxCol,
      rowCount,
      colCount,
      cellCount: rowCount * colCount,
      isSingleCell: minRow === maxRow && minCol === maxCol
    };
  }

  /**
   * Render spreadsheet table and selection highlight
   */
  render() {
    this.renderHeader();
    this.renderBody();
    this.updateSelectionHighlight();
    this.notifyChanges();
  }

  setLanguage(lang = 'ar') {
    this.lang = lang;
    const localized = getLocalizedColumns(lang);
    const map = new Map(localized.map(c => [c.id, c.label]));
    for (const col of this.columns) {
      if (map.has(col.id)) {
        col.label = map.get(col.id);
      }
    }
    const t = TRANSLATIONS[this.lang] || TRANSLATIONS.ar;
    if (this.floatingToolbar) {
      const pasteLbl = this.floatingToolbar.querySelector('[data-action="cell-paste"] .cft-label');
      if (pasteLbl) pasteLbl.textContent = t.cellMenuPaste || 'لصق';
      const copyLbl = this.floatingToolbar.querySelector('[data-action="cell-copy"] .cft-label');
      if (copyLbl) copyLbl.textContent = t.cellMenuCopy || 'نسخ';
      const editLbl = this.floatingToolbar.querySelector('[data-action="cell-edit"] .cft-label');
      if (editLbl) editLbl.textContent = t.cellMenuEdit || 'تعديل';
      const clearLbl = this.floatingToolbar.querySelector('[data-action="cell-clear"] .cft-label');
      if (clearLbl) clearLbl.textContent = t.cellMenuClear || 'مسح';
    }
    this.render();
  }

  renderHeader() {
    const visibleCols = this.getVisibleColumns();
    const addColText = this.lang === 'ar' ? '+ إضافة عمود' : '+ Add Column';
    let thHtml = `
      <tr>
        <th class="sheet-corner-cell">
          <span class="corner-hash">#</span>
        </th>
    `;

    for (let c = 0; c < visibleCols.length; c++) {
      const col = visibleCols[c];
      thHtml += `
        <th class="sheet-col-header" data-col-idx="${c}" data-col-id="${col.id}" title="${col.label}">
          <div class="col-header-inner">
            <span class="col-title">${this.escapeHTML(col.label)}</span>
            <div class="col-actions">
              <button type="button" class="col-menu-btn" data-action="col-menu" title="Column options">⋮</button>
            </div>
          </div>
        </th>
      `;
    }

    thHtml += `
        <th class="sheet-add-col-header">
          <button type="button" class="add-col-btn" id="btn-add-col-header" title="${addColText}">${addColText}</button>
        </th>
      </tr>
    `;

    this.thead.innerHTML = thHtml;
  }

  renderBody() {
    const visibleCols = this.getVisibleColumns();
    let bodyHtml = '';

    for (let r = 0; r < this.rows.length; r++) {
      const row = this.rows[r];
      const isSelected = this.selectedRowIndices.has(r);

      bodyHtml += `
        <tr class="sheet-row ${isSelected ? 'row-selected' : ''}" data-row-idx="${r}">
          <th class="sheet-row-header" data-row-idx="${r}" title="Click or drag to select row">
            <span class="row-num">${r + 1}</span>
            <button type="button" class="row-delete-btn" data-action="delete-row" title="Delete row">×</button>
          </th>
      `;

      for (let c = 0; c < visibleCols.length; c++) {
        const col = visibleCols[c];
        const val = row[col.id] || '';
        bodyHtml += `
          <td class="sheet-cell" data-row-idx="${r}" data-col-idx="${c}" data-col-id="${col.id}">
            <div class="cell-content">${this.escapeHTML(val)}</div>
          </td>
        `;
      }

      bodyHtml += `<td class="sheet-cell-ghost"></td></tr>`;
    }

    this.tbody.innerHTML = bodyHtml;
  }

  /**
   * Shows floating cell context menu (triggered only on long-press or context menu)
   */
  showFloatingToolbar() {
    if (!this.floatingToolbar) return;

    if (this.isEditing) {
      this.hideFloatingToolbar();
      return;
    }

    const activeCell = this.tbody.querySelector(`td[data-row-idx="${this.activeRowIdx}"][data-col-idx="${this.activeColIdx}"]`);
    if (!activeCell) {
      this.hideFloatingToolbar();
      return;
    }

    this.floatingToolbar.style.display = 'flex';

    const cellTop = activeCell.offsetTop;
    const cellLeft = activeCell.offsetLeft;
    const cellHeight = activeCell.offsetHeight;
    const cellWidth = activeCell.offsetWidth;
    const toolbarHeight = 36;

    let top = cellTop - toolbarHeight - 6;
    if (top < this.scrollPane.scrollTop + 32) {
      top = cellTop + cellHeight + 6;
    }

    let left = cellLeft;
    if (this.lang === 'ar') {
      left = Math.max(10, cellLeft + cellWidth - 230);
    } else {
      left = Math.max(10, cellLeft);
    }

    this.floatingToolbar.style.top = `${top}px`;
    this.floatingToolbar.style.left = `${left}px`;
  }

  hideFloatingToolbar() {
    if (this.floatingToolbar) {
      this.floatingToolbar.style.display = 'none';
    }
  }

  /**
   * 1-Tap Paste from system clipboard into the active cell
   */
  async pasteFromClipboard() {
    const t = TRANSLATIONS[this.lang] || TRANSLATIONS.ar;
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          this.handlePaste(text);
          this.onToast(t.toastClipboardPasted || (this.lang === 'ar' ? 'تم لصق البيانات في الجدول' : 'Data pasted into sheet'));
          return true;
        } else {
          this.onToast(this.lang === 'ar' ? 'الحافظة فارغة' : 'Clipboard is empty');
          return false;
        }
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (err) {
      console.warn('Direct clipboard paste failed or permission denied:', err);
      const quickPasteModal = document.getElementById('quick-paste-modal');
      if (quickPasteModal) {
        quickPasteModal.showModal();
        const input = document.getElementById('quick-paste-input');
        if (input) input.focus();
      }
      return false;
    }
  }

  escapeHTML(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Bulk Saudi Phone Standardizer (+966)
   */
  standardizeAllPhones() {
    let count = 0;
    for (const r of this.rows) {
      if (r.phoneCell) {
        const std = standardizeSaudiPhone(r.phoneCell);
        if (std && std !== r.phoneCell) {
          r.phoneCell = std;
          count++;
        }
      }
      if (r.phoneWork) {
        const std = standardizeSaudiPhone(r.phoneWork);
        if (std && std !== r.phoneWork) {
          r.phoneWork = std;
          count++;
        }
      }
    }
    if (count > 0) {
      this.saveHistory(`Standardize ${count} Phones`);
      this.render();
    }
    return count;
  }

  /**
   * Highlighting multi-cell selection range and headers
   */
  updateSelectionHighlight() {
    const prevHighlighted = this.container.querySelectorAll(
      '.cell-active, .cell-anchor, .cell-in-range, .cell-range-top, .cell-range-bottom, ' +
      '.cell-range-left, .cell-range-right, .cell-range-handle, ' +
      '.header-col-active, .header-row-active'
    );
    prevHighlighted.forEach(el => {
      el.classList.remove(
        'cell-active', 'cell-anchor', 'cell-in-range', 'cell-range-top', 'cell-range-bottom',
        'cell-range-left', 'cell-range-right', 'cell-range-handle',
        'header-col-active', 'header-row-active'
      );
    });

    const visibleCols = this.getVisibleColumns();
    if (this.rows.length === 0 || visibleCols.length === 0) {
      if (this.floatingToolbar) this.floatingToolbar.style.display = 'none';
      return;
    }

    const range = this.getSelectionRange();

    const minRow = Math.max(0, Math.min(this.rows.length - 1, range.minRow));
    const maxRow = Math.max(0, Math.min(this.rows.length - 1, range.maxRow));
    const minCol = Math.max(0, Math.min(visibleCols.length - 1, range.minCol));
    const maxCol = Math.max(0, Math.min(visibleCols.length - 1, range.maxCol));

    for (let r = minRow; r <= maxRow; r++) {
      const th = this.tbody.querySelector(`th.sheet-row-header[data-row-idx="${r}"]`);
      if (th) th.classList.add('header-row-active');
    }

    for (let c = minCol; c <= maxCol; c++) {
      const th = this.thead.querySelector(`th.sheet-col-header[data-col-idx="${c}"]`);
      if (th) th.classList.add('header-col-active');
    }

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = this.tbody.querySelector(`td[data-row-idx="${r}"][data-col-idx="${c}"]`);
        if (!cell) continue;

        if (range.isSingleCell) {
          cell.classList.add('cell-active');
        } else {
          cell.classList.add('cell-in-range');

          if (r === this.activeRowIdx && c === this.activeColIdx) {
            cell.classList.add('cell-anchor');
          }
          if (r === minRow) cell.classList.add('cell-range-top');
          if (r === maxRow) cell.classList.add('cell-range-bottom');
          if (c === minCol) cell.classList.add('cell-range-left');
          if (c === maxCol) cell.classList.add('cell-range-right');
          if (r === maxRow && c === maxCol) cell.classList.add('cell-range-handle');
        }
      }
    }

    const activeCol = visibleCols[this.activeColIdx];
    const activeVal = this.rows[this.activeRowIdx] ? (this.rows[this.activeRowIdx][activeCol?.id] || '') : '';
    this.onSelectionChange({
      rowIndex: this.activeRowIdx,
      colIndex: this.activeColIdx,
      column: activeCol,
      value: activeVal,
      range: range,
      totalRows: this.rows.length,
      totalCols: visibleCols.length
    });
  }

  setActiveCell(rowIdx, colIdx, enterEdit = false, extendSelection = false) {
    const visibleCols = this.getVisibleColumns();
    if (this.isEditing) {
      this.commitEdit();
    }

    const clampedRow = Math.max(0, Math.min(this.rows.length - 1, rowIdx));
    const clampedCol = Math.max(0, Math.min(visibleCols.length - 1, colIdx));

    if (extendSelection) {
      this.selectionFocus = { row: clampedRow, col: clampedCol };
    } else {
      this.activeRowIdx = clampedRow;
      this.activeColIdx = clampedCol;
      this.selectionAnchor = { row: clampedRow, col: clampedCol };
      this.selectionFocus = { row: clampedRow, col: clampedCol };
    }

    this.updateSelectionHighlight();

    if (enterEdit) {
      this.startEditing();
    } else {
      this.scrollCellIntoView(clampedRow, clampedCol);
    }
  }

  scrollCellIntoView(rowIdx, colIdx) {
    const cell = this.tbody.querySelector(`td[data-row-idx="${rowIdx}"][data-col-idx="${colIdx}"]`);
    if (cell && this.scrollPane) {
      const paneRect = this.scrollPane.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();

      if (cellRect.top < paneRect.top + 36) {
        this.scrollPane.scrollTop -= (paneRect.top + 36 - cellRect.top);
      } else if (cellRect.bottom > paneRect.bottom) {
        this.scrollPane.scrollTop += (cellRect.bottom - paneRect.bottom);
      }

      if (cellRect.left < paneRect.left + 50) {
        this.scrollPane.scrollLeft -= (paneRect.left + 50 - cellRect.left);
      } else if (cellRect.right > paneRect.right) {
        this.scrollPane.scrollLeft += (cellRect.right - paneRect.right);
      }
    }
  }

  /**
   * Cell Editing Mode
   */
  startEditing(initialChar = null) {
    if (this.isEditing) return;

    if (this.floatingToolbar) {
      this.floatingToolbar.style.display = 'none';
    }

    this.selectionAnchor = { row: this.activeRowIdx, col: this.activeColIdx };
    this.selectionFocus = { row: this.activeRowIdx, col: this.activeColIdx };
    this.updateSelectionHighlight();

    const visibleCols = this.getVisibleColumns();
    const cell = this.tbody.querySelector(`td[data-row-idx="${this.activeRowIdx}"][data-col-idx="${this.activeColIdx}"]`);
    if (!cell) return;

    this.isEditing = true;
    cell.classList.add('is-editing');

    const col = visibleCols[this.activeColIdx];
    const originalVal = this.rows[this.activeRowIdx][col.id] || '';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sheet-cell-editor';
    input.value = initialChar !== null ? initialChar : originalVal;

    const contentDiv = cell.querySelector('.cell-content');
    contentDiv.style.display = 'none';
    cell.appendChild(input);

    input.focus();
    if (initialChar === null) {
      input.select();
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.commitEdit();
        if (e.shiftKey) {
          this.setActiveCell(this.activeRowIdx - 1, this.activeColIdx);
        } else {
          if (this.activeRowIdx === this.rows.length - 1) {
            this.addRow();
          }
          this.setActiveCell(this.activeRowIdx + 1, this.activeColIdx);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.commitEdit();
        if (e.shiftKey) {
          this.setActiveCell(this.activeRowIdx, this.activeColIdx - 1);
        } else {
          this.setActiveCell(this.activeRowIdx, this.activeColIdx + 1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      if (this.isEditing) {
        this.commitEdit();
      }
    });
  }

  commitEdit() {
    if (!this.isEditing) return;
    const visibleCols = this.getVisibleColumns();
    const cell = this.tbody.querySelector(`td[data-row-idx="${this.activeRowIdx}"][data-col-idx="${this.activeColIdx}"]`);
    if (!cell) {
      this.isEditing = false;
      return;
    }

    const input = cell.querySelector('.sheet-cell-editor');
    let newVal = input ? input.value.trim() : '';

    const col = visibleCols[this.activeColIdx];
    // Auto-standardize Saudi phone number format
    if (col && (col.id === 'phoneCell' || col.id === 'phoneWork')) {
      newVal = standardizeSaudiPhone(newVal);
    }

    const oldVal = this.rows[this.activeRowIdx][col.id] || '';

    if (newVal !== oldVal) {
      this.rows[this.activeRowIdx][col.id] = newVal;
      this.saveHistory(`Edit [${this.activeRowIdx + 1}, ${col.label}]`);
    }

    if (input) input.remove();
    const contentDiv = cell.querySelector('.cell-content');
    if (contentDiv) {
      contentDiv.textContent = newVal;
      contentDiv.style.display = '';
    }

    cell.classList.remove('is-editing');
    this.isEditing = false;
    this.notifyChanges();
    this.hideFloatingToolbar();
    this.scrollPane.focus({ preventScroll: true });
  }

  cancelEdit() {
    if (!this.isEditing) return;
    const cell = this.tbody.querySelector(`td[data-row-idx="${this.activeRowIdx}"][data-col-idx="${this.activeColIdx}"]`);
    if (cell) {
      const input = cell.querySelector('.sheet-cell-editor');
      if (input) input.remove();
      const contentDiv = cell.querySelector('.cell-content');
      if (contentDiv) contentDiv.style.display = '';
      cell.classList.remove('is-editing');
    }
    this.isEditing = false;
    this.hideFloatingToolbar();
    this.scrollPane.focus({ preventScroll: true });
  }

  setActiveCellValue(val) {
    const visibleCols = this.getVisibleColumns();
    const col = visibleCols[this.activeColIdx];
    if (!col || !this.rows[this.activeRowIdx]) return;

    let finalVal = val;
    if (col.id === 'phoneCell' || col.id === 'phoneWork') {
      finalVal = standardizeSaudiPhone(val);
    }

    this.rows[this.activeRowIdx][col.id] = finalVal;
    const cell = this.tbody.querySelector(`td[data-row-idx="${this.activeRowIdx}"][data-col-idx="${this.activeColIdx}"]`);
    if (cell) {
      const contentDiv = cell.querySelector('.cell-content');
      if (contentDiv) contentDiv.textContent = finalVal;
    }
    this.saveHistory('Edit via Cell Bar');
    this.notifyChanges();
  }

  clearSelectedRange() {
    const range = this.getSelectionRange();
    const visibleCols = this.getVisibleColumns();

    for (let r = range.minRow; r <= range.maxRow; r++) {
      for (let c = range.minCol; c <= range.maxCol; c++) {
        const col = visibleCols[c];
        if (col && this.rows[r]) {
          this.rows[r][col.id] = '';
        }
      }
    }

    this.saveHistory(range.isSingleCell ? 'Clear Cell' : `Clear Range (${range.cellCount} cells)`);
    this.render();
  }

  async copySelectedRangeToClipboard() {
    const range = this.getSelectionRange();
    const visibleCols = this.getVisibleColumns();
    const lines = [];

    for (let r = range.minRow; r <= range.maxRow; r++) {
      const rowVals = [];
      for (let c = range.minCol; c <= range.maxCol; c++) {
        const col = visibleCols[c];
        rowVals.push(col && this.rows[r] ? (this.rows[r][col.id] || '') : '');
      }
      lines.push(rowVals.join('\t'));
    }

    const tsv = lines.join('\r\n');
    try {
      await navigator.clipboard.writeText(tsv);
      this.onToast(range.isSingleCell ? (this.lang === 'ar' ? 'تم نسخ الخلية' : 'Cell copied') : (this.lang === 'ar' ? `تم نسخ ${range.cellCount} خلية` : `Copied ${range.cellCount} cells`));
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  }

  addRow(index = null) {
    const newRow = this.createEmptyRow();
    if (index === null || index >= this.rows.length) {
      this.rows.push(newRow);
    } else {
      this.rows.splice(index, 0, newRow);
    }
    this.saveHistory('Add Row');
    this.render();
  }

  deleteRow(index) {
    if (this.rows.length <= 1) {
      this.rows = [this.createEmptyRow()];
    } else {
      this.rows.splice(index, 1);
    }

    if (this.activeRowIdx >= this.rows.length) {
      this.activeRowIdx = this.rows.length - 1;
    }
    this.selectionAnchor = { row: this.activeRowIdx, col: this.activeColIdx };
    this.selectionFocus = { row: this.activeRowIdx, col: this.activeColIdx };
    this.selectedRowIndices.clear();
    this.saveHistory('Delete Row');
    this.render();
  }

  duplicateRow(index) {
    if (index < 0 || index >= this.rows.length) return;
    const src = this.rows[index];
    const dup = { ...src, _id: this.generateId() };
    this.rows.splice(index + 1, 0, dup);
    this.saveHistory('Duplicate Row');
    this.render();
  }

  clearAllRows() {
    this.rows = Array.from({ length: 8 }, () => this.createEmptyRow());
    this.activeRowIdx = 0;
    this.activeColIdx = 0;
    this.selectionAnchor = { row: 0, col: 0 };
    this.selectionFocus = { row: 0, col: 0 };
    this.selectedRowIndices.clear();
    this.saveHistory('Clear All');
    this.render();
  }

  addColumn(label) {
    const cleanLabel = (label || '').trim();
    if (!cleanLabel) return;

    let baseId = cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!baseId) baseId = 'col';
    let id = baseId;
    let counter = 1;
    while (this.columns.some(c => c.id === id)) {
      id = `${baseId}_${counter++}`;
    }

    this.columns.push({ id, label: cleanLabel });
    for (const r of this.rows) {
      r[id] = '';
    }

    this.saveHistory(`Add Column ${cleanLabel}`);
    this.render();
  }

  deleteColumn(colId) {
    if (this.columns.length <= 1) return;
    this.columns = this.columns.filter(c => c.id !== colId);
    this.hiddenColumnIds.delete(colId);

    const visibleCols = this.getVisibleColumns();
    if (this.activeColIdx >= visibleCols.length) {
      this.activeColIdx = Math.max(0, visibleCols.length - 1);
    }
    this.selectionAnchor = { row: this.activeRowIdx, col: this.activeColIdx };
    this.selectionFocus = { row: this.activeRowIdx, col: this.activeColIdx };

    this.saveHistory('Delete Column');
    this.render();
  }

  renameColumn(colId, newLabel) {
    const col = this.columns.find(c => c.id === colId);
    if (col && newLabel && newLabel.trim()) {
      col.label = newLabel.trim();
      this.saveHistory('Rename Column');
      this.render();
    }
  }

  clearColumnValues(colId) {
    for (const r of this.rows) {
      r[colId] = '';
    }
    this.saveHistory('Clear Column');
    this.render();
  }

  getEmptyColumnIds() {
    return this.columns
      .filter(col => {
        return this.rows.every(r => {
          const val = r[col.id];
          return val === undefined || val === null || String(val).trim() === '';
        });
      })
      .map(col => col.id);
  }

  toggleHideEmptyColumns() {
    const emptyIds = this.getEmptyColumnIds();
    if (emptyIds.length === 0) return { changed: false, count: 0, areHidden: false };

    const allHidden = emptyIds.every(id => this.hiddenColumnIds.has(id));

    if (allHidden) {
      emptyIds.forEach(id => this.hiddenColumnIds.delete(id));
    } else {
      emptyIds.forEach(id => this.hiddenColumnIds.add(id));
    }

    const visibleCols = this.getVisibleColumns();
    if (this.activeColIdx >= visibleCols.length) {
      this.activeColIdx = Math.max(0, visibleCols.length - 1);
    }
    this.selectionAnchor = { row: this.activeRowIdx, col: this.activeColIdx };
    this.selectionFocus = { row: this.activeRowIdx, col: this.activeColIdx };

    this.render();
    return {
      changed: true,
      count: emptyIds.length,
      areHidden: !allHidden
    };
  }

  purgeEmptyColumns() {
    const emptyIds = this.getEmptyColumnIds();
    if (emptyIds.length === 0) return 0;

    this.columns = this.columns.filter(c => !emptyIds.includes(c.id));
    emptyIds.forEach(id => this.hiddenColumnIds.delete(id));

    const visibleCols = this.getVisibleColumns();
    if (this.activeColIdx >= visibleCols.length) {
      this.activeColIdx = Math.max(0, visibleCols.length - 1);
    }
    this.selectionAnchor = { row: this.activeRowIdx, col: this.activeColIdx };
    this.selectionFocus = { row: this.activeRowIdx, col: this.activeColIdx };

    this.saveHistory('Purge Empty Columns');
    this.render();
    return emptyIds.length;
  }

  handlePaste(text) {
    if (!text) return;
    const lines = text.split(/\r?\n/).filter(line => line.length > 0);
    if (lines.length === 0) return;

    const pasteData = lines.map(line => line.split('\t'));
    const visibleCols = this.getVisibleColumns();

    const startRow = this.activeRowIdx;
    const startCol = this.activeColIdx;

    const requiredRows = startRow + pasteData.length;
    while (this.rows.length < requiredRows) {
      this.rows.push(this.createEmptyRow());
    }

    for (let r = 0; r < pasteData.length; r++) {
      const targetRowIdx = startRow + r;
      const rowVals = pasteData[r];

      for (let c = 0; c < rowVals.length; c++) {
        const targetColIdx = startCol + c;
        if (targetColIdx < visibleCols.length) {
          const col = visibleCols[targetColIdx];
          let v = rowVals[c].trim();
          if (col.id === 'phoneCell' || col.id === 'phoneWork') {
            v = standardizeSaudiPhone(v);
          }
          this.rows[targetRowIdx][col.id] = v;
        }
      }
    }

    this.selectionAnchor = { row: startRow, col: startCol };
    this.selectionFocus = {
      row: Math.min(this.rows.length - 1, startRow + pasteData.length - 1),
      col: Math.min(visibleCols.length - 1, startCol + pasteData[0].length - 1)
    };

    this.saveHistory('Paste Clipboard Data');
    this.render();
  }

  saveHistory(actionName) {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    const snapshot = {
      action: actionName,
      columns: JSON.parse(JSON.stringify(this.columns)),
      rows: JSON.parse(JSON.stringify(this.rows))
    };

    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const snapshot = this.history[this.historyIndex];
      this.columns = JSON.parse(JSON.stringify(snapshot.columns));
      this.rows = JSON.parse(JSON.stringify(snapshot.rows));
      this.render();
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const snapshot = this.history[this.historyIndex];
      this.columns = JSON.parse(JSON.stringify(snapshot.columns));
      this.rows = JSON.parse(JSON.stringify(snapshot.rows));
      this.render();
      return true;
    }
    return false;
  }

  notifyChanges() {
    const visibleCols = this.getVisibleColumns();
    const activeContacts = this.rows.filter(r => {
      return Object.entries(r).some(([k, v]) => !k.startsWith('_') && v && String(v).trim() !== '');
    });

    this.onDataChange({
      totalRows: this.rows.length,
      activeContactsCount: activeContacts.length,
      totalColumns: this.columns.length,
      visibleColumnsCount: visibleCols.length,
      emptyColumnsCount: this.getEmptyColumnIds().length
    });
  }

  bindEvents() {
    // Floating Toolbar Action Handlers
    if (this.floatingToolbar) {
      this.floatingToolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.cft-btn');
        if (!btn) return;
        e.stopPropagation();
        e.preventDefault();

        const action = btn.dataset.action;
        if (action === 'cell-paste') {
          this.pasteFromClipboard();
        } else if (action === 'cell-copy') {
          this.copySelectedRangeToClipboard();
        } else if (action === 'cell-edit') {
          this.startEditing();
        } else if (action === 'cell-std') {
          const visibleCols = this.getVisibleColumns();
          const col = visibleCols[this.activeColIdx];
          if (col && this.rows[this.activeRowIdx]) {
            const raw = this.rows[this.activeRowIdx][col.id];
            if (raw) {
              this.rows[this.activeRowIdx][col.id] = standardizeSaudiPhone(raw);
              this.saveHistory('Standardize Phone');
              this.render();
            }
          }
        } else if (action === 'cell-clear') {
          this.clearSelectedRange();
        }
      });
    }

    // Hide floating toolbar on scroll
    this.scrollPane.addEventListener('scroll', () => {
      this.hideFloatingToolbar();
    }, { passive: true });

    // Mobile Touch / Long-press on cells: ONLY show floating choices on click-and-hold
    let touchTimer = null;
    let touchMoved = false;
    let touchStartPos = { x: 0, y: 0 };

    this.tbody.addEventListener('touchstart', (e) => {
      const cell = e.target.closest('td.sheet-cell');
      if (!cell) return;
      touchMoved = false;
      const touch = e.touches[0];
      if (touch) {
        touchStartPos = { x: touch.clientX, y: touch.clientY };
      }

      const r = parseInt(cell.dataset.rowIdx, 10);
      const c = parseInt(cell.dataset.colIdx, 10);

      touchTimer = setTimeout(() => {
        if (!touchMoved) {
          this.setActiveCell(r, c, false, false);
          this.showFloatingToolbar();
          if (navigator.vibrate) navigator.vibrate(35);
        }
      }, 450);
    }, { passive: true });

    this.tbody.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        if (Math.hypot(touch.clientX - touchStartPos.x, touch.clientY - touchStartPos.y) > 8) {
          touchMoved = true;
          if (touchTimer) clearTimeout(touchTimer);
          this.hideFloatingToolbar();
        }
      }
    }, { passive: true });

    this.tbody.addEventListener('touchend', (e) => {
      if (touchTimer) clearTimeout(touchTimer);
      if (!touchMoved) {
        const cell = e.target.closest('td.sheet-cell');
        if (cell) {
          const r = parseInt(cell.dataset.rowIdx, 10);
          const c = parseInt(cell.dataset.colIdx, 10);
          this.setActiveCell(r, c, false, false);
          this.hideFloatingToolbar();
        }
      }
    });

    // Context menu / Right-click on cell triggers floating choices
    this.tbody.addEventListener('contextmenu', (e) => {
      const cell = e.target.closest('td.sheet-cell');
      if (cell) {
        e.preventDefault();
        const r = parseInt(cell.dataset.rowIdx, 10);
        const c = parseInt(cell.dataset.colIdx, 10);
        this.setActiveCell(r, c, false, false);
        this.showFloatingToolbar();
      }
    });

    // Hide floating toolbar when clicking outside
    document.addEventListener('pointerdown', (e) => {
      if (this.floatingToolbar && !this.floatingToolbar.contains(e.target) && !e.target.closest('td.sheet-cell')) {
        this.hideFloatingToolbar();
      }
    });

    // Cell Mouse Down: Start click-and-drag range selection
    this.tbody.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      this.hideFloatingToolbar();

      const deleteBtn = e.target.closest('[data-action="delete-row"]');
      if (deleteBtn) return;

      const rowHeader = e.target.closest('th.sheet-row-header');
      if (rowHeader) {
        e.preventDefault();
        const r = parseInt(rowHeader.dataset.rowIdx, 10);
        const visibleCols = this.getVisibleColumns();
        this.isSelectingRowHeaders = true;
        this.table.classList.add('is-selecting');

        if (e.shiftKey) {
          this.selectionFocus = { row: r, col: visibleCols.length - 1 };
        } else {
          this.activeRowIdx = r;
          this.activeColIdx = 0;
          this.selectionAnchor = { row: r, col: 0 };
          this.selectionFocus = { row: r, col: visibleCols.length - 1 };
        }
        this.updateSelectionHighlight();
        this.scrollPane.focus({ preventScroll: true });
        return;
      }

      const cell = e.target.closest('td.sheet-cell');
      if (cell) {
        const r = parseInt(cell.dataset.rowIdx, 10);
        const c = parseInt(cell.dataset.colIdx, 10);

        if (this.isEditing) {
          this.commitEdit();
        }

        e.preventDefault();

        if (e.shiftKey) {
          this.setActiveCell(r, c, false, true);
        } else {
          this.setActiveCell(r, c, false, false);
        }

        this.isSelecting = true;
        this.table.classList.add('is-selecting');
        this.scrollPane.focus({ preventScroll: true });
      }
    });

    this.tbody.addEventListener('mouseover', (e) => {
      if (this.isSelecting) {
        const cell = e.target.closest('td.sheet-cell');
        if (cell) {
          const r = parseInt(cell.dataset.rowIdx, 10);
          const c = parseInt(cell.dataset.colIdx, 10);
          if (r !== this.selectionFocus.row || c !== this.selectionFocus.col) {
            this.selectionFocus = { row: r, col: c };
            this.updateSelectionHighlight();
          }
        }
      } else if (this.isSelectingRowHeaders) {
        const rowHeader = e.target.closest('th.sheet-row-header');
        if (rowHeader) {
          const r = parseInt(rowHeader.dataset.rowIdx, 10);
          const visibleCols = this.getVisibleColumns();
          if (r !== this.selectionFocus.row) {
            this.selectionFocus = { row: r, col: visibleCols.length - 1 };
            this.updateSelectionHighlight();
          }
        }
      }
    });

    this.thead.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.id === 'btn-add-col-header' || e.target.closest('[data-action="col-menu"]')) return;

      const th = e.target.closest('th.sheet-col-header');
      if (th) {
        e.preventDefault();
        const c = parseInt(th.dataset.colIdx, 10);
        this.isSelectingColHeaders = true;
        this.table.classList.add('is-selecting');

        if (e.shiftKey) {
          this.selectionFocus = { row: this.rows.length - 1, col: c };
        } else {
          this.activeRowIdx = 0;
          this.activeColIdx = c;
          this.selectionAnchor = { row: 0, col: c };
          this.selectionFocus = { row: this.rows.length - 1, col: c };
        }
        this.updateSelectionHighlight();
        this.scrollPane.focus({ preventScroll: true });
      }
    });

    this.thead.addEventListener('mouseover', (e) => {
      if (this.isSelectingColHeaders) {
        const th = e.target.closest('th.sheet-col-header');
        if (th) {
          const c = parseInt(th.dataset.colIdx, 10);
          if (c !== this.selectionFocus.col) {
            this.selectionFocus = { row: this.rows.length - 1, col: c };
            this.updateSelectionHighlight();
          }
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isSelecting || this.isSelectingRowHeaders || this.isSelectingColHeaders) {
        this.isSelecting = false;
        this.isSelectingRowHeaders = false;
        this.isSelectingColHeaders = false;
        this.table.classList.remove('is-selecting');
      }
    });

    this.tbody.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-action="delete-row"]');
      if (deleteBtn) {
        const rowHeader = deleteBtn.closest('.sheet-row-header');
        if (rowHeader) {
          const r = parseInt(rowHeader.dataset.rowIdx, 10);
          this.deleteRow(r);
        }
      }
    });

    this.tbody.addEventListener('dblclick', (e) => {
      const cell = e.target.closest('td.sheet-cell');
      if (cell) {
        const r = parseInt(cell.dataset.rowIdx, 10);
        const c = parseInt(cell.dataset.colIdx, 10);
        this.setActiveCell(r, c, true, false);
      }
    });

    this.thead.addEventListener('click', (e) => {
      if (e.target.id === 'btn-add-col-header') {
        const promptText = this.lang === 'ar' ? 'أدخل اسم العمود الجديد:' : 'Enter new column name:';
        const name = prompt(promptText);
        if (name) this.addColumn(name);
        return;
      }

      const menuBtn = e.target.closest('[data-action="col-menu"]');
      if (menuBtn) {
        const th = menuBtn.closest('th.sheet-col-header');
        if (th) {
          this.showColumnContextMenu(th.dataset.colId, menuBtn);
        }
      }
    });

    // Keyboard Navigation
    this.scrollPane.addEventListener('keydown', (e) => {
      if (this.isEditing) return;

      const visibleCols = this.getVisibleColumns();

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        this.copySelectedRangeToClipboard();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        this.copySelectedRangeToClipboard().then(() => {
          this.clearSelectedRange();
        });
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        this.selectionAnchor = { row: 0, col: 0 };
        this.selectionFocus = { row: this.rows.length - 1, col: visibleCols.length - 1 };
        this.activeRowIdx = 0;
        this.activeColIdx = 0;
        this.updateSelectionHighlight();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) {
            this.selectionFocus.row = Math.max(0, this.selectionFocus.row - 1);
            this.updateSelectionHighlight();
          } else {
            this.setActiveCell(this.activeRowIdx - 1, this.activeColIdx);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
            this.selectionFocus.row = Math.min(this.rows.length - 1, this.selectionFocus.row + 1);
            this.updateSelectionHighlight();
          } else {
            this.setActiveCell(this.activeRowIdx + 1, this.activeColIdx);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            this.selectionFocus.col = Math.max(0, this.selectionFocus.col - 1);
            this.updateSelectionHighlight();
          } else {
            this.setActiveCell(this.activeRowIdx, this.activeColIdx - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            this.selectionFocus.col = Math.min(visibleCols.length - 1, this.selectionFocus.col + 1);
            this.updateSelectionHighlight();
          } else {
            this.setActiveCell(this.activeRowIdx, this.activeColIdx + 1);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            this.setActiveCell(this.activeRowIdx, this.activeColIdx - 1);
          } else {
            this.setActiveCell(this.activeRowIdx, this.activeColIdx + 1);
          }
          break;
        case 'Enter':
          e.preventDefault();
          this.startEditing();
          break;
        case 'Escape':
          e.preventDefault();
          this.selectionAnchor = { row: this.activeRowIdx, col: this.activeColIdx };
          this.selectionFocus = { row: this.activeRowIdx, col: this.activeColIdx };
          this.updateSelectionHighlight();
          break;
        case 'Backspace':
        case 'Delete':
          e.preventDefault();
          this.clearSelectedRange();
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            this.startEditing(e.key);
          }
          break;
      }
    });

    window.addEventListener('paste', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (text) {
        e.preventDefault();
        this.handlePaste(text);
      }
    });
  }

  showColumnContextMenu(colId, triggerEl) {
    const col = this.columns.find(c => c.id === colId);
    if (!col) return;

    const t = TRANSLATIONS[this.lang] || TRANSLATIONS.ar;
    const choice = prompt(
      t.colMenuPrompt.replace('{label}', col.label),
      '1'
    );

    if (choice === '1') {
      const newName = prompt(t.colRenamePrompt, col.label);
      if (newName) this.renameColumn(colId, newName);
    } else if (choice === '2') {
      if (confirm(t.colClearConfirm.replace('{label}', col.label))) {
        this.clearColumnValues(colId);
      }
    } else if (choice === '3') {
      if (confirm(t.colDeleteConfirm.replace('{label}', col.label))) {
        this.deleteColumn(colId);
      }
    }
  }

  /**
   * Update a specific contact row by index
   */
  updateContact(index, data) {
    if (index >= 0 && index < this.rows.length) {
      this.rows[index] = { ...this.rows[index], ...data };
      if (this.rows[index].phoneCell) {
        this.rows[index].phoneCell = standardizeSaudiPhone(this.rows[index].phoneCell);
      }
      if (this.rows[index].phoneWork) {
        this.rows[index].phoneWork = standardizeSaudiPhone(this.rows[index].phoneWork);
      }
      this.saveHistory('Edit Contact Details');
      this.render();
    }
  }

  /**
   * Exportable Clean Contacts List
   */
  getContacts() {
    return this.rows.map(r => {
      const copy = { ...r };
      delete copy._id;
      return copy;
    });
  }
}
