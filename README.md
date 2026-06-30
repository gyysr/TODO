# Electron Todo & Notepad

基于 Electron + Spring Boot 的桌面记事本与待办管理应用。

## 功能特性

### 记事本
- 笔记的增删改查，数据持久化到后端
- 富文本格式工具栏：**加粗**、*斜体*、<u>下划线</u>、~~删除线~~
- 快捷键支持：`Ctrl/Cmd + B` 加粗、`Ctrl/Cmd + I` 斜体、`Ctrl/Cmd + U` 下划线
- 9 种字体可选（系统默认、苹方、宋体、楷体、等宽字体等）
- 12 色文字颜色可选
- 字体、颜色、格式偏好通过 localStorage 持久化
- 字符数 / 字数实时统计

### 待办列表
- 待办的增删改查，支持标题 + 描述编辑
- 全部 / 未完成 / 已完成筛选
- 一键标记完成，统计完成进度

### 其他
- 自定义弹窗系统，兼容 Electron 环境（替代原生 prompt/alert/confirm）
- 模块化前端架构

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Electron 35, HTML/CSS/JS |
| 后端 | Spring Boot 3.4.1, Spring Data JPA |
| 数据库 | H2 (文件持久化) |
| 构建 | Gradle 8.x (后端), electron-builder (前端) |

## 项目结构

```
Todo/
├── main.js                  # Electron 主进程
├── renderer.js              # 渲染进程入口
├── index.html               # 前端界面
├── modules/
│   ├── api.js               # 后端 API 请求封装
│   ├── modal.js             # 自定义弹窗系统
│   ├── notes.js             # 记事本模块
│   ├── todos.js             # 待办列表模块
│   └── utils.js             # 工具函数
├── backend/
│   ├── src/main/java/com/todo/
│   │   ├── TodoApplication.java
│   │   ├── controller/
│   │   │   ├── TodoController.java
│   │   │   └── NoteController.java
│   │   ├── model/
│   │   │   ├── Todo.java
│   │   │   └── Note.java
│   │   └── repository/
│   │       ├── TodoRepository.java
│   │       └── NoteRepository.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── build.gradle
└── package.json
```

## 快速开始

### 环境要求
- Node.js >= 18
- Java 21
- Gradle >= 8

### 启动后端

```bash
cd backend
gradle bootRun
```

后端运行在 http://localhost:8080，H2 控制台：http://localhost:8080/h2-console

### 启动前端

```bash
npm install
npm start
```

## API 接口

### 待办 `/api/todos`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/todos` | 获取所有待办 |
| GET | `/api/todos/{id}` | 获取单个待办 |
| POST | `/api/todos` | 新建待办 |
| PUT | `/api/todos/{id}` | 更新待办 |
| DELETE | `/api/todos/{id}` | 删除待办 |

### 笔记 `/api/notes`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notes` | 获取所有笔记 |
| GET | `/api/notes/{id}` | 获取单个笔记 |
| POST | `/api/notes` | 新建笔记 |
| PUT | `/api/notes/{id}` | 更新笔记 |
| DELETE | `/api/notes/{id}` | 删除笔记 |

## 许可证

MIT
