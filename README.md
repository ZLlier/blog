# 雾岛

个人博客：Typora 写 Markdown → `npm run publish` → `git push` → 自动构建上线（Cloudflare Pages）。

## 写作流程

```bash
# 1. 在 Typora 里写文章（图片用"复制到指定路径 ./media/${文件名}/"）
# 2. 发布到博客内容目录（md + 图片文件夹一起复制，自动补 frontmatter）
npm run publish -- 文章名

# 3. 提交并推送（触发自动部署）
cd D:\Mine\Code\Zcode\Blog
git add .
git commit -m "发布：文章名"
git push
```

## frontmatter 约定（三个字段都可省略）

```markdown
---
title: 文章标题        # 省略 → 取正文第一个 # 标题
date: 2026-08-13       # 省略 → 取文件修改时间；必须 YYYY-MM-DD
tags:
  - 技术
  - 折腾
---

正文……
```

## 图片规则

- 文章内图片引用 `./media/文章名/xxx.png`（相对路径）
- 构建时自动把 `src/content/blog/media/` 复制到 `public/media/` 并重写路径，文章和图片永远在一起
- 想分享带图 md 给别人：Typora 菜单「格式 → 图片 → 上传所有本地图片」（PicGo + 腾讯 COS），另存为再发，博客管线对两种引用都无感

## 目录结构

```
src/content/blog/       文章（Markdown 文件夹 = 事实来源）
src/content/blog/media/ 每篇文章的图片文件夹
src/content.config.ts   内容加载器（frontmatter 回退派生逻辑）
src/remark/             自定义 remark 插件（图片路径重写）
src/integrations/       Astro 集成（media 复制）
scripts/publish.mjs     发布脚本（先改 scripts/publish.config.mjs 配置笔记目录）
```

## 常用命令

```bash
npm run dev        # 本地预览 http://localhost:4321
npm run build      # 构建产物在 dist/
npm run publish -- 文件名 [--force]   # 发布文章
```

## 国内网络备忘

- npm 装包慢/卡：用镜像源 `npm install --registry=https://registry.npmmirror.com`
- push GitHub 慢/超时：SSH 走 443 端口（`~/.ssh/config` 加 `Host github.com / Hostname ssh.github.com / Port 443`），或给 git 配代理
- 网站无外部字体/CDN 请求，全部系统字体栈

## 待办（第二期）

- 自定义域名（先在 Cloudflare Pages 设置里绑）
- 站内搜索（超过 50 篇再加 Pagefind）
