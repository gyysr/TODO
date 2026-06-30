// modules/modal.js - 自定义弹窗系统
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalForm = document.getElementById('modalForm');
const modalPicker = document.getElementById('modalPicker');
const modalOk = document.getElementById('modalOk');
const modalCancel = document.getElementById('modalCancel');

/**
 * 显示通用弹窗
 * @param {Object} options
 * @param {string} options.title - 标题
 * @param {string} options.input - 'text' | 'form' | null
 * @param {string} options.defaultValue - 单输入框默认值
 * @param {Array}  options.fields - 表单字段 [{name, label, value, type}]
 * @param {string} options.okText
 * @param {string} options.cancelText
 * @param {boolean} options.danger
 */
function showModal({ title, input, defaultValue, fields, okText, cancelText, danger }) {
  return new Promise((resolve) => {
    modalTitle.textContent = title;

    // 单输入框模式
    if (input === 'text') {
      modalInput.style.display = 'block';
      modalInput.value = defaultValue || '';
      modalForm.style.display = 'none';
      modalPicker.style.display = 'none';
      setTimeout(() => { modalInput.focus(); modalInput.select(); }, 50);
    }
    // 表单模式（多字段）
    else if (input === 'form' && fields) {
      modalInput.style.display = 'none';
      modalForm.style.display = 'block';
      modalPicker.style.display = 'none';
      modalForm.innerHTML = fields.map(f => `
        <div class="modal-field">
          <label class="modal-label">${f.label}</label>
          ${f.type === 'textarea'
            ? `<textarea class="modal-textarea" data-name="${f.name}" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>`
            : `<input class="modal-input" data-name="${f.name}" value="${f.value || ''}" placeholder="${f.placeholder || ''}" />`
          }
        </div>
      `).join('');
      const firstInput = modalForm.querySelector('input, textarea');
      if (firstInput) setTimeout(() => { firstInput.focus(); firstInput.select(); }, 50);
    }
    // 纯提示模式
    else {
      modalInput.style.display = 'none';
      modalForm.style.display = 'none';
      modalPicker.style.display = 'none';
    }

    modalOk.textContent = okText || '确定';
    modalCancel.textContent = cancelText || '取消';
    modalOk.className = 'modal-btn' + (danger ? ' danger' : ' primary');
    modalOverlay.classList.add('active');

    function cleanup() {
      modalOverlay.classList.remove('active');
      modalOk.onclick = null;
      modalCancel.onclick = null;
      modalInput.onkeydown = null;
    }

    function getValue() {
      if (input === 'text') return modalInput.value;
      if (input === 'form') {
        const result = {};
        modalForm.querySelectorAll('[data-name]').forEach(el => {
          result[el.dataset.name] = el.value;
        });
        return result;
      }
      return true;
    }

    modalOk.onclick = () => { const v = getValue(); cleanup(); resolve(v); };
    modalCancel.onclick = () => { cleanup(); resolve(null); };
    modalInput.onkeydown = (e) => {
      if (e.key === 'Enter') modalOk.click();
      if (e.key === 'Escape') modalCancel.click();
    };
    // 表单模式：Enter 确认，Esc 取消
    modalForm.onkeydown = (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); modalOk.click(); }
      if (e.key === 'Escape') modalCancel.click();
    };
  });
}

// 便捷方法
function showAlert(msg) {
  return showModal({ title: msg, okText: '知道了', cancelText: '关闭' });
}

async function showConfirm(msg) {
  const result = await showModal({ title: msg, okText: '确定', cancelText: '取消' });
  return result !== null;
}

async function showConfirmDanger(msg) {
  const result = await showModal({ title: msg, okText: '删除', cancelText: '取消', danger: true });
  return result !== null;
}

function showPrompt(msg, defaultVal) {
  return showModal({ title: msg, input: 'text', defaultValue: defaultVal });
}

/**
 * 显示表单弹窗（多字段编辑）
 * @param {string} title
 * @param {Array<{name, label, value, type}>} fields
 */
function showFormDialog(title, fields) {
  return showModal({
    title,
    input: 'form',
    fields,
    okText: '保存',
    cancelText: '取消'
  });
}

module.exports = { showAlert, showConfirm, showConfirmDanger, showPrompt, showFormDialog, showPicker };

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 显示选择器弹窗（字体、颜色等网格选择）
 * @param {string} title
 * @param {Array<{value, label, style}>} items - style 为内联样式用于预览
 * @param {string} currentValue - 当前选中值
 */
function showPicker(title, items, currentValue) {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalInput.style.display = 'none';
    modalForm.style.display = 'none';
    modalPicker.style.display = 'grid';
    modalOk.textContent = '确定';
    modalCancel.textContent = '取消';
    modalOk.className = 'modal-btn primary';

    let selected = currentValue;

    modalPicker.innerHTML = items.map((item, idx) => `
      <div class="picker-item ${item.value === currentValue ? 'selected' : ''}"
           data-index="${idx}" style="${escapeAttr(item.style || '')}"
           title="${escapeAttr(item.label)}">
        ${item.swatch ? `<span class="picker-swatch" style="background:${escapeAttr(item.swatch)}"></span>` : ''}
        <span class="picker-label">${escapeHtml(item.label)}</span>
      </div>
    `).join('');

    modalPicker.querySelectorAll('.picker-item').forEach(el => {
      const idx = parseInt(el.dataset.index);
      el.addEventListener('click', () => {
        modalPicker.querySelectorAll('.picker-item').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        selected = items[idx].value;
      });
      el.addEventListener('dblclick', () => {
        selected = items[idx].value;
        cleanup();
        resolve(selected);
      });
    });

    modalOverlay.classList.add('active');

    function cleanup() {
      modalOverlay.classList.remove('active');
      modalOk.onclick = null;
      modalCancel.onclick = null;
    }

    modalOk.onclick = () => { cleanup(); resolve(selected); };
    modalCancel.onclick = () => { cleanup(); resolve(null); };
  });
}
