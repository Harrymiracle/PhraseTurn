import type { TranslationResult } from '../types';

// MyMemory 免费翻译 API 端点
const API_BASE = 'https://api.mymemory.translated.net/get';
// 源语言|目标语言
const LANG_PAIR = 'en|zh-CN';
// 单次翻译文本上限，避免触发 5000 字符/天限额
const MAX_TEXT_LENGTH = 500;

// MyMemory 响应结构（仅取需要的字段）
interface MyMemoryResponse {
  responseData: {
    translatedText: string;
    match: number;
  };
  responseStatus: number;
  matches?: unknown[];
}

// 翻译英文文本为中文
export async function translate(text: string): Promise<TranslationResult> {
  // 截断超长文本
  const source = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
  const url = `${API_BASE}?q=${encodeURIComponent(source)}&langpair=${encodeURIComponent(LANG_PAIR)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: MyMemoryResponse = await response.json();
  if (data.responseStatus !== 200) {
    throw new Error(`MyMemory ${data.responseStatus}: ${data.responseData?.translatedText ?? 'unknown'}`);
  }

  const translated = data.responseData?.translatedText;
  if (!translated) {
    throw new Error('MyMemory 返回空译文');
  }

  return {
    source,
    translated,
    createdAt: Date.now(),
  };
}
