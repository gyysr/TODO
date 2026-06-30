// modules/todos.js - 待办列表模块
const { request, checkBackend, updateBackendStatus } = require('./api');
const { showAlert, showConfirmDanger, showFormDialog } = require('./modal');
const { escapeHtml, formatTime } = require('./utils');

const RESOURCE = 'todos';

// DOM 元素
const todoTitleInput = document.getElementById('todoTitleInput');
const todoDescInput = document.getElementById('todoDescInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoListEl = document.getElementById('todoList');
const todoStats = document.getElementById('todoStats');

let currentFilter = 'all';

async function loadTodos() {
  const connected = await checkBackend();
  updateBackendStatus(connected);
  if (!connected) {
    todoListEl.innerHTML = '<li class="todo-empty">后端服务未连接</li>';
    return;
  }
  try {
    let query = '';
    if (currentFilter === 'pending') query = '?completed=false';
    else if (currentFilter === 'done') query = '?completed=true';
    const todos = await request(RESOURCE, 'GET', query);
    renderTodos(todos);
  } catch (err) {
    todoListEl.innerHTML = `<li class="todo-empty">加载失败: ${err.message}</li>`;
  }
}

function renderTodos(todos) {
  if (!todos || todos.length === 0) {
    todoListEl.innerHTML = '<li class="todo-empty">暂无待办事项</li>';
    updateStats([]);
    return;
  }
  todoListEl.innerHTML = todos.map(todo => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
      <input type="checkbox" ${todo.completed ? 'checked' : ''}
             onchange="toggleTodo(${todo.id}, this.checked)" />
      <div class="todo-info">
        <div class="todo-title">${escapeHtml(todo.title)}</div>
        ${todo.description ? `<div class="todo-desc">${escapeHtml(todo.description)}</div>` : ''}
        <div class="todo-time">${formatTime(todo.createdAt)}</div>
      </div>
      <div class="todo-actions">
        <button onclick="startEditTodo(${todo.id})">编辑</button>
        <button class="del-btn" onclick="deleteTodo(${todo.id})">删除</button>
      </div>
    </li>
  `).join('');
  updateStats(todos);
}

function updateStats(todos) {
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  todoStats.textContent = `共 ${total} 项，已完成 ${done} 项`;
}

// 暴露给 HTML onclick
window.toggleTodo = async function(id, completed) {
  try {
    await request(RESOURCE, 'PUT', `/${id}`, { completed });
    await loadTodos();
  } catch (err) {
    showAlert('更新失败: ' + err.message);
  }
};

window.deleteTodo = async function(id) {
  if (!(await showConfirmDanger('确定删除此待办？'))) return;
  try {
    await request(RESOURCE, 'DELETE', `/${id}`);
    await loadTodos();
  } catch (err) {
    showAlert('删除失败: ' + err.message);
  }
};

// 编辑待办 - 使用表单弹窗，一次编辑标题和描述
window.startEditTodo = async function(id) {
  try {
    const todo = await request(RESOURCE, 'GET', `/${id}`);
    const result = await showFormDialog('编辑待办', [
      { name: 'title', label: '标题', value: todo.title, type: 'input' },
      { name: 'description', label: '描述', value: todo.description || '', type: 'textarea', placeholder: '添加描述...' }
    ]);
    if (!result) return;
    await request(RESOURCE, 'PUT', `/${id}`, {
      title: result.title.trim() || todo.title,
      description: result.description.trim() || null
    });
    await loadTodos();
  } catch (err) {
    showAlert('编辑失败: ' + err.message);
  }
};

function init() {
  addTodoBtn.addEventListener('click', async () => {
    const title = todoTitleInput.value.trim();
    if (!title) { todoTitleInput.focus(); return; }
    try {
      await request(RESOURCE, 'POST', '', {
        title,
        description: todoDescInput.value.trim() || null,
        completed: false
      });
      todoTitleInput.value = '';
      todoDescInput.value = '';
      todoTitleInput.focus();
      await loadTodos();
    } catch (err) {
      showAlert('添加失败: ' + err.message);
    }
  });

  todoTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodoBtn.click();
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadTodos();
    });
  });
}

module.exports = { init, loadTodos };
