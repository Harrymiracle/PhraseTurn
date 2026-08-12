import { loadHistory, clearHistory, deleteHistoryItem } from '../lib/storage';
import type { HistoryEntry } from '../types';

const listEl = document.getElementById('history-list') as HTMLDivElement;
const emptyStateEl = document.getElementById('empty-state') as HTMLDivElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;

// 格式化相对时间
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  // 超过 30 天显示日期
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

// 渲染单条历史
function renderHistoryItem(entry: HistoryEntry): HTMLElement {
  const item = document.createElement('div');
  item.className = 'history-item';

  const sourceDiv = document.createElement('div');
  sourceDiv.className = 'source';
  sourceDiv.textContent = entry.source;
  sourceDiv.title = entry.source;
  item.appendChild(sourceDiv);

  const translatedDiv = document.createElement('div');
  translatedDiv.className = 'translated';
  translatedDiv.textContent = entry.translated;
  item.appendChild(translatedDiv);

  const footerDiv = document.createElement('div');
  footerDiv.className = 'item-footer';

  const timeDiv = document.createElement('div');
  timeDiv.className = 'time';
  timeDiv.textContent = formatRelativeTime(entry.createdAt);
  footerDiv.appendChild(timeDiv);

  const delBtn = document.createElement('button');
  delBtn.className = 'item-del-btn';
  delBtn.type = 'button';
  delBtn.textContent = '删除';
  delBtn.addEventListener('click', async () => {
    await deleteHistoryItem(entry.createdAt);
    await render();
  });
  footerDiv.appendChild(delBtn);

  item.appendChild(footerDiv);

  return item;
}

// 渲染历史列表
async function render(): Promise<void> {
  const history = await loadHistory();

  if (history.length === 0) {
    listEl.hidden = true;
    emptyStateEl.hidden = false;
    clearBtn.disabled = true;
    return;
  }

  listEl.hidden = false;
  emptyStateEl.hidden = true;
  clearBtn.disabled = false;

  // 按时间倒序显示（最新的在上）
  const sorted = [...history].reverse();
  listEl.replaceChildren(...sorted.map(renderHistoryItem));
}

// 清空按钮点击
clearBtn.addEventListener('click', async () => {
  if (!window.confirm('确认清空所有翻译历史？')) return;
  await clearHistory();
  await render();
});

// 初始化渲染
render();
