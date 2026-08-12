// PhraseTurn 后台 service worker
import { translate } from '../lib/translator';
import { addHistory } from '../lib/storage';
import type { TranslateMessage } from '../types';

// 右键菜单 ID
const MENU_ID = 'translate-selection';

// 扩展安装/更新时注册右键菜单
chrome.runtime.onInstalled.addListener(async () => {
  // 先清空旧菜单，避免更新后重复 id 报错
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: '翻译选中文本',
    contexts: ['selection'],
  });
  console.log('[PhraseTurn] 扩展已安装');
});

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const sourceText = info.selectionText;
  if (!sourceText) return;
  const tabId = tab?.id;
  if (typeof tabId !== 'number') return;

  try {
    const result = await translate(sourceText);

    // 先把译文发给当前页的 content script 显示浮窗
    // content script 可能在 chrome:// 等页面未注入，失败仅打日志
    const resultMessage: TranslateMessage = { type: 'translate_result', payload: result };
    chrome.tabs.sendMessage(tabId, resultMessage).catch(() => {
      console.warn('[PhraseTurn] 当前页面无法显示浮窗（content script 未注入）');
    });

    // 写入历史，失败仅日志，不阻塞主流程
    addHistory(result).catch((e) => {
      console.warn('[PhraseTurn] 历史写入失败', e);
    });
  } catch (error) {
    console.error('[PhraseTurn] 翻译失败', error);
    const message = error instanceof Error ? error.message : String(error);
    const errorMessage: TranslateMessage = { type: 'translate_error', message };
    chrome.tabs.sendMessage(tabId, errorMessage).catch(() => {
      // content script 未注入时错误信息只在 service worker 日志可见
    });
  }
});
