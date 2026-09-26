import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';
const previewBridge = {
  name: 'summon-preview-bridge',
  transformIndexHtml(html: string) {
    const tag = '<script src="https://summon.dev/preview-bridge.js" data-parent-origin="https://summon.dev"></script>';
    return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + tag) : tag + html;
  },
};
export default mergeConfig(base, defineConfig({ server: { host: true, allowedHosts: true }, plugins: [previewBridge] }));
