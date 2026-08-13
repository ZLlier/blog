// Astro 集成：构建/开发启动前，把 content/blog/media/<文章名>/ 下的图片
// 复制到 public/media/<文章名>/，使 /media/xxx 成为可直接访问的站点路径。
// public/media 已加入 .gitignore（生成物不入库）。
import type { AstroIntegration } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG_DIR = fileURLToPath(new URL('../content/blog', import.meta.url));
const MEDIA_SRC = path.join(BLOG_DIR, 'media');
const PUBLIC_MEDIA = fileURLToPath(new URL('../../public/media', import.meta.url));

export function copyBlogMedia(): AstroIntegration {
  return {
    name: 'copy-blog-media',
    hooks: {
      'astro:config:setup': () => {
        if (!fs.existsSync(MEDIA_SRC)) return;
        fs.mkdirSync(PUBLIC_MEDIA, { recursive: true });
        for (const postDir of fs.readdirSync(MEDIA_SRC, { withFileTypes: true })) {
          if (!postDir.isDirectory()) continue;
          fs.cpSync(path.join(MEDIA_SRC, postDir.name), path.join(PUBLIC_MEDIA, postDir.name), {
            recursive: true,
            force: true,
          });
        }
      },
    },
  };
}
