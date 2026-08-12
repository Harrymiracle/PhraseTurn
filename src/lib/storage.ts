import type { HistoryEntry } from '../types';

// 历史记录条数上限
const MAX_HISTORY = 200;
// chrome.storage.local 中的 key
const HISTORY_KEY = 'history';

// 读取所有历史记录（按时间正序，旧的在前）
export async function loadHistory(): Promise<HistoryEntry[]> {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  const history = result[HISTORY_KEY];
  return Array.isArray(history) ? (history as HistoryEntry[]) : [];
}

// 新增一条历史记录（超过上限裁掉最旧的，FIFO）
export async function addHistory(entry: HistoryEntry): Promise<void> {
  const history = await loadHistory();
  history.push(entry);
  const trimmed = history.length > MAX_HISTORY ? history.slice(-MAX_HISTORY) : history;
  await chrome.storage.local.set({ [HISTORY_KEY]: trimmed });
}

// 删除指定时间戳的单条历史记录
export async function deleteHistoryItem(timestamp: number): Promise<void> {
  const history = await loadHistory();
  const filtered = history.filter((item) => item.createdAt !== timestamp);
  await chrome.storage.local.set({ [HISTORY_KEY]: filtered });
}

// 清空所有历史记录
export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEY);
}
