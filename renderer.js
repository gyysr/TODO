// renderer.js - 主入口，模块初始化
const notes = require('./modules/notes');
const todos = require('./modules/todos');

// 标签切换
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Panel').classList.add('active');
    if (btn.dataset.tab === 'todo') todos.loadTodos();
    if (btn.dataset.tab === 'notepad') notes.loadNotes();
  });
});

// 初始化各模块
notes.init();
todos.init();
