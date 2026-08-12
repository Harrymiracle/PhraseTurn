import { defineManifest } from '@crxjs/vite-plugin';

// Chrome MV3 manifest 配置
export default defineManifest({
  manifest_version: 3,
  name: 'PhraseTurn',
  version: '1.0.0',
  description: '选中右键立即翻译英文',
  permissions: ['contextMenus', 'storage'],
  host_permissions: ['https://api.mymemory.translated.net/*'],
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content-script.ts'],
      css: ['src/content/content.css'],
    },
  ],
  action: {
    default_popup: 'src/popup/popup.html',
    default_title: 'PhraseTurn 翻译历史',
  },
});
