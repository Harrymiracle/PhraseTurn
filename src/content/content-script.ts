// PhraseTurn content script：监听翻译结果消息，在选区附近显示 Shadow DOM 浮窗
import type { TranslateMessage } from '../types';

// 浮窗自动消失时间
const AUTO_DISMISS_MS = 5000;
// 浮窗与选区的间距
const GAP = 8;
// 浮窗最大宽度
const MAX_WIDTH = 360;

// 浮窗内容
interface PopupContent {
  // 原文（错误时可不传）
  source?: string;
  // 译文或错误消息
  text: string;
  // 是否为错误浮窗
  isError: boolean;
}

// 当前浮窗宿主元素
let host: HTMLDivElement | null = null;
// 自动消失定时器
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

// 关闭并清理当前浮窗
function dismiss(): void {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  if (host !== null) {
    host.remove();
    host = null;
  }
}

// 计算浮窗位置，避免超出 viewport
function computePosition(rect: DOMRect): { left: number; top: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  // 预估浮窗尺寸（实际尺寸要等渲染后才有，这里用上限估算）
  const estimatedWidth = Math.min(MAX_WIDTH, viewportWidth - GAP * 2);
  const estimatedHeight = 120;

  // 默认放在选区右下方
  let left = rect.right + GAP;
  let top = rect.bottom + GAP;

  // 右边越界：放到选区左侧
  if (left + estimatedWidth > viewportWidth - GAP) {
    left = Math.max(GAP, rect.left - estimatedWidth - GAP);
  }
  // 下边越界：放到选区上方
  if (top + estimatedHeight > viewportHeight - GAP) {
    top = Math.max(GAP, rect.top - estimatedHeight - GAP);
  }

  return { left, top };
}

// 取选区 rect，失败回退到视口左上角
function getSelectionRect(): DOMRect {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    return selection.getRangeAt(0).getBoundingClientRect();
  }
  return new DOMRect(GAP, GAP, 0, 0);
}

// 显示浮窗
function showPopup(content: PopupContent, rect: DOMRect): void {
  // 先清理已有浮窗
  dismiss();

  // 创建宿主元素
  host = document.createElement('div');
  host.id = 'phraseturn-host';
  const { left, top } = computePosition(rect);
  host.style.cssText = [
    'position: fixed',
    `left: ${left}px`,
    `top: ${top}px`,
    'z-index: 2147483647',
    'pointer-events: auto',
  ].join(';');

  // 开启 Shadow DOM，隔离宿主页面 CSS
  const shadow = host.attachShadow({ mode: 'open' });

  // 注入样式（内联，避免和 content.css 耦合）
  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      font-family: system-ui, -apple-system, "Microsoft YaHei", sans-serif;
      font-size: 14px;
      color: #1f2329;
      line-height: 1.5;
      display: block;
    }
    .bubble {
      max-width: ${MAX_WIDTH}px;
      padding: 8px 12px;
      border-radius: 6px;
      background: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(0, 0, 0, 0.06);
      word-break: break-word;
      white-space: normal;
    }
    .bubble.error {
      border-color: #f5222d;
      color: #f5222d;
    }
    .source {
      color: #8a8f99;
      font-size: 12px;
      margin-bottom: 4px;
      max-height: 60px;
      overflow: hidden;
    }
    .translated {
      color: #1f2329;
    }
  `;
  shadow.appendChild(style);

  // 构造内容
  const bubble = document.createElement('div');
  bubble.className = content.isError ? 'bubble error' : 'bubble';

  // 非错误且有原文时，在译文上方显示原文（小灰字）
  if (!content.isError && content.source) {
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'source';
    sourceDiv.textContent = content.source;
    bubble.appendChild(sourceDiv);
  }
  const textDiv = document.createElement('div');
  textDiv.className = 'translated';
  textDiv.textContent = content.text;
  bubble.appendChild(textDiv);
  shadow.appendChild(bubble);

  // 加入页面
  document.documentElement.appendChild(host);

  // 启动自动消失定时器
  dismissTimer = setTimeout(dismiss, AUTO_DISMISS_MS);
}

// 监听 background 发来的消息
chrome.runtime.onMessage.addListener((message: TranslateMessage) => {
  if (message.type === 'translate_result') {
    const rect = getSelectionRect();
    showPopup(
      { source: message.payload.source, text: message.payload.translated, isError: false },
      rect,
    );
  } else if (message.type === 'translate_error') {
    const rect = getSelectionRect();
    showPopup({ text: `翻译失败：${message.message}`, isError: true }, rect);
  }
});

// 点击浮窗外部、按 Esc、滚动、缩放时关闭浮窗
document.addEventListener(
  'mousedown',
  (event) => {
    if (host === null) return;
    if (host.contains(event.target as Node)) return;
    dismiss();
  },
  true,
);

document.addEventListener(
  'keydown',
  (event) => {
    if (event.key === 'Escape') dismiss();
  },
  true,
);

window.addEventListener('scroll', dismiss, true);
window.addEventListener('resize', dismiss);
