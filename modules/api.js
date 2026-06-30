// modules/api.js - 通用 API 请求封装
const API_BASE = 'http://localhost:8080/api';

async function request(resource, method, path, body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}/${resource}${path || ''}`, options);
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function checkBackend() {
  try {
    await fetch(`${API_BASE}/todos`);
    return true;
  } catch {
    return false;
  }
}

function updateBackendStatus(connected) {
  const el = document.getElementById('backendStatus');
  if (!el) return;
  el.textContent = connected ? '后端已连接' : '后端未连接（请先启动后端服务）';
  el.style.color = connected ? '#34c759' : '#ff3b30';
}

module.exports = { request, checkBackend, updateBackendStatus };
