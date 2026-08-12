// 翻译结果
export interface TranslationResult {
  // 原文
  source: string;
  // 译文
  translated: string;
  // 创建时间戳（毫秒）
  createdAt: number;
}

// 历史记录条目（与翻译结果同形）
export type HistoryEntry = TranslationResult;

// background -> content script 消息类型
export type TranslateMessage =
  | { type: 'translate_result'; payload: TranslationResult }
  | { type: 'translate_error'; message: string };
