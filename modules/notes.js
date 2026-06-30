// modules/notes.js - 记事本模块
const { request, checkBackend, updateBackendStatus } = require('./api');
const { showAlert, showConfirm, showPicker } = require('./modal');
const { escapeHtml, formatTime } = require('./utils');

const RESOURCE = 'notes';

// DOM 元素
const editor = document.getElementById('editor');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteList = document.getElementById('noteList');
const newNoteBtn = document.getElementById('newNoteBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const noteSaveStatus = document.getElementById('noteSaveStatus');

let currentNoteId = null;
let noteDirty = false;

function updateCounts() {
  const text = editor.value;
  charCount.textContent = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  wordCount.textContent = words;
}

function setDirty(dirty) {
  noteDirty = dirty;
  noteSaveStatus.textContent = dirty ? '未保存' : '已保存';
  noteSaveStatus.style.color = dirty ? '#ff9500' : '#34c759';
}

function setEditorEnabled(enabled) {
  noteTitleInput.disabled = !enabled;
  editor.disabled = !enabled;
  saveNoteBtn.disabled = !enabled;
}

async function loadNotes() {
  const connected = await checkBackend();
  updateBackendStatus(connected);
  if (!connected) {
    noteList.innerHTML = '<li class="note-empty-sidebar">后端未连接</li>';
    return;
  }
  try {
    const notes = await request(RESOURCE, 'GET');
    renderNoteList(notes);
  } catch {
    noteList.innerHTML = '<li class="note-empty-sidebar">加载失败</li>';
  }
}

function renderNoteList(notes) {
  if (!notes || notes.length === 0) {
    noteList.innerHTML = '<li class="note-empty-sidebar">暂无笔记<br>点击 "+ 新建" 开始</li>';
    return;
  }
  noteList.innerHTML = notes.map(note => `
    <li class="note-list-item ${note.id === currentNoteId ? 'active' : ''}"
        data-id="${note.id}" onclick="selectNote(${note.id})">
      <div class="note-item-info">
        <div class="note-item-title">${escapeHtml(note.title)}</div>
        <div class="note-item-time">${formatTime(note.updatedAt)}</div>
      </div>
      <button class="note-item-del" onclick="event.stopPropagation(); deleteNote(${note.id})" title="删除">✕</button>
    </li>
  `).join('');
}

// 暴露给 HTML onclick
window.selectNote = async function(id) {
  if (noteDirty && currentNoteId) {
    if (!(await showConfirm('当前笔记有未保存的修改，是否放弃？'))) return;
  }
  try {
    const note = await request(RESOURCE, 'GET', `/${id}`);
    currentNoteId = note.id;
    noteTitleInput.value = note.title;
    editor.value = note.content || '';
    setEditorEnabled(true);
    setDirty(false);
    updateCounts();
    document.querySelectorAll('.note-list-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.id) === id);
    });
  } catch (err) {
    showAlert('加载笔记失败: ' + err.message);
  }
};

window.deleteNote = async function(id) {
  const { showConfirmDanger } = require('./modal');
  if (!(await showConfirmDanger('确定删除此笔记？'))) return;
  try {
    await request(RESOURCE, 'DELETE', `/${id}`);
    if (currentNoteId === id) {
      currentNoteId = null;
      noteTitleInput.value = '';
      editor.value = '';
      setEditorEnabled(false);
      setDirty(false);
      noteSaveStatus.textContent = '';
      updateCounts();
    }
    await loadNotes();
  } catch (err) {
    showAlert('删除失败: ' + err.message);
  }
};

function init() {
  editor.addEventListener('input', () => { updateCounts(); setDirty(true); });
  noteTitleInput.addEventListener('input', () => { setDirty(true); });

  newNoteBtn.addEventListener('click', async () => {
    if (noteDirty && currentNoteId) {
      if (!(await showConfirm('当前笔记有未保存的修改，是否放弃？'))) return;
    }
    try {
      const note = await request(RESOURCE, 'POST', '', { title: '未命名笔记', content: '' });
      currentNoteId = note.id;
      noteTitleInput.value = note.title;
      editor.value = '';
      setEditorEnabled(true);
      setDirty(false);
      noteSaveStatus.textContent = '';
      updateCounts();
      noteTitleInput.focus();
      noteTitleInput.select();
      await loadNotes();
    } catch (err) {
      showAlert('新建失败: ' + err.message);
    }
  });

  saveNoteBtn.addEventListener('click', async () => {
    if (!currentNoteId) return;
    const title = noteTitleInput.value.trim() || '未命名笔记';
    try {
      await request(RESOURCE, 'PUT', `/${currentNoteId}`, { title, content: editor.value });
      setDirty(false);
      await loadNotes();
    } catch (err) {
      showAlert('保存失败: ' + err.message);
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (currentNoteId) saveNoteBtn.click();
    }
  });

  document.getElementById('fontBtn').addEventListener('click', () => changeFont());
  document.getElementById('colorBtn').addEventListener('click', () => changeColor());

  // 格式按钮
  document.getElementById('boldBtn').addEventListener('click', () => toggleFormat('bold'));
  document.getElementById('italicBtn').addEventListener('click', () => toggleFormat('italic'));
  document.getElementById('underlineBtn').addEventListener('click', () => toggleFormat('underline'));
  document.getElementById('strikeBtn').addEventListener('click', () => toggleFormat('strikethrough'));
  document.getElementById('normalBtn').addEventListener('click', () => resetFormat());

  // 快捷键
  editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); toggleFormat('bold'); }
      if (e.key === 'i') { e.preventDefault(); toggleFormat('italic'); }
      if (e.key === 'u') { e.preventDefault(); toggleFormat('underline'); }
    }
  });

  // 恢复上次保存的字体、颜色和格式
  applyEditorStyle();
  applyFormat();

  updateCounts();
  loadNotes();
}

module.exports = { init, loadNotes };

// ==========================================
// 字体和颜色功能
// ==========================================
const FONT_OPTIONS = [
  { value: '-apple-system, BlinkMacSystemFont, sans-serif', label: '系统默认' },
  { value: '"PingFang SC", "Hiragino Sans GB", sans-serif', label: '苹方' },
  { value: '"Microsoft YaHei", sans-serif', label: '微软雅黑' },
  { value: '"SimSun", "宋体", serif', label: '宋体' },
  { value: '"KaiTi", "楷体", serif', label: '楷体' },
  { value: '"Menlo", "Consolas", "Courier New", monospace', label: '等宽字体' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
  { value: '"Helvetica Neue", Arial, sans-serif', label: 'Helvetica' },
  { value: '"Comic Sans MS", cursive', label: 'Comic Sans' },
];

const COLOR_OPTIONS = [
  { value: '#1c1c1e', label: '黑色' },
  { value: '#3a3a3c', label: '深灰' },
  { value: '#6c6c70', label: '灰色' },
  { value: '#ff3b30', label: '红色' },
  { value: '#ff9500', label: '橙色' },
  { value: '#ffcc00', label: '黄色' },
  { value: '#34c759', label: '绿色' },
  { value: '#007aff', label: '蓝色' },
  { value: '#5856d6', label: '紫色' },
  { value: '#af52de', label: '洋红' },
  { value: '#ff2d55', label: '粉红' },
  { value: '#8e8e93', label: '银色' },
];

function getEditorFont() {
  return localStorage.getItem('editor-font') || FONT_OPTIONS[0].value;
}

function getEditorColor() {
  return localStorage.getItem('editor-color') || COLOR_OPTIONS[0].value;
}

function applyEditorStyle() {
  editor.style.fontFamily = getEditorFont();
  editor.style.color = getEditorColor();
}

async function changeFont() {
  const current = getEditorFont();
  const items = FONT_OPTIONS.map(f => ({
    value: f.value,
    label: f.label,
    style: `font-family: ${f.value};`
  }));
  const chosen = await showPicker('选择字体', items, current);
  if (chosen === null) return;
  localStorage.setItem('editor-font', chosen);
  applyEditorStyle();
}

async function changeColor() {
  const current = getEditorColor();
  const items = COLOR_OPTIONS.map(c => ({
    value: c.value,
    label: c.label,
    swatch: c.value
  }));
  const chosen = await showPicker('选择颜色', items, current);
  if (chosen === null) return;
  localStorage.setItem('editor-color', chosen);
  applyEditorStyle();
}

// ==========================================
// 格式切换功能
// ==========================================
const FORMAT_KEYS = ['bold', 'italic', 'underline', 'strikethrough'];
const FORMAT_BTN_MAP = {
  bold: 'boldBtn',
  italic: 'italicBtn',
  underline: 'underlineBtn',
  strikethrough: 'strikeBtn'
};

function getFormatState() {
  try {
    return JSON.parse(localStorage.getItem('editor-format')) || {};
  } catch {
    return {};
  }
}

function saveFormatState(state) {
  localStorage.setItem('editor-format', JSON.stringify(state));
}

function toggleFormat(key) {
  const state = getFormatState();
  state[key] = !state[key];
  saveFormatState(state);
  applyFormat();
}

function resetFormat() {
  const state = {};
  FORMAT_KEYS.forEach(k => { state[k] = false; });
  saveFormatState(state);
  applyFormat();
}

function applyFormat() {
  const state = getFormatState();
  // 加粗
  editor.style.fontWeight = state.bold ? 'bold' : 'normal';
  // 斜体
  editor.style.fontStyle = state.italic ? 'italic' : 'normal';
  // 下划线 + 删除线（text-decoration 可叠加）
  const decorations = [];
  if (state.underline) decorations.push('underline');
  if (state.strikethrough) decorations.push('line-through');
  editor.style.textDecoration = decorations.length ? decorations.join(' ') : 'none';
  // 更新按钮激活状态
  FORMAT_KEYS.forEach(key => {
    const btn = document.getElementById(FORMAT_BTN_MAP[key]);
    if (btn) btn.classList.toggle('active', !!state[key]);
  });
}
