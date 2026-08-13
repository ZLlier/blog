// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { copyBlogMedia } from './src/integrations/copy-media';
import { remarkRewriteMedia } from './src/remark/rewrite-media';

// https://astro.build/config
export default defineConfig({
  // 上线后在 Cloudflare Pages 设置里会分配 pages.dev 域名，按实际值修改这里
  site: 'https://wudao.pages.dev',
  integrations: [copyBlogMedia(), sitemap()],
  // 关闭开发模式右下角的悬浮调试工具条（Astro Dev Toolbar，只有英文且对博客无用）
  devToolbar: { enabled: false },
  markdown: {
    // Astro 7：默认处理器是 satteri()；我们用 unified() 以便挂载自定义 remark 插件
    processor: unified({
      remarkPlugins: [remarkRewriteMedia],
    }),
    shikiConfig: {
      // 白天/夜间双主题代码高亮：CSS 通过 --shiki-* 变量控制
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
