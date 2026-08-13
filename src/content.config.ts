// 雾岛内容集合：自定义 loader
// 规则（与用户约定的"问题10"一致）：
//   - frontmatter 三个字段 title/date/tags 全部可缺省
//   - 缺失 title → 取正文首个 H1；缺失 date → 取文件修改时间；缺失 tags → 空
//   - 空文件（无正文）直接跳过
import { defineCollection, z } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readingMinutes, excerptFrom } from './lib/post';

const CONTENT_DIR = fileURLToPath(new URL('./content/blog', import.meta.url));

interface FmData {
  title?: string;
  date?: string;
  tags?: string[];
}

/** 解析我们约定的 YAML 子集：title / date / tags（行内 [a,b] 或块状 - 列表） */
function parseFrontmatter(raw: string): { data: FmData; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { data: {}, body: raw };
  const fm = match[1];
  const body = raw.slice(match[0].length);
  const data: FmData = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const value = m[2].trim();
    if (key === 'tags') {
      if (value.startsWith('[') && value.endsWith(']')) {
        data.tags = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
      } else if (value) {
        data.tags = [value];
      } else {
        data.tags = []; // 可能后面跟块状列表
      }
    } else {
      data[key as 'title' | 'date'] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  // 块状 tags 列表（- item）
  if (data.tags && data.tags.length === 0) {
    const lines = fm.split(/\r?\n/);
    const idx = lines.findIndex((l) => /^tags:\s*$/.test(l));
    if (idx >= 0) {
      const tags: string[] = [];
      for (const l of lines.slice(idx + 1)) {
        const item = l.match(/^\s*-\s+(.+)$/);
        if (item) tags.push(item[1].trim());
        else if (/^\S/.test(l)) break;
      }
      if (tags.length) data.tags = tags;
      else delete data.tags;
    } else {
      delete data.tags;
    }
  }
  return { data, body };
}

const blog = defineCollection({
  // Astro 7：自定义 loader 用对象形态，load() 才会收到 context
  loader: {
    name: 'wudao-blog-loader',
    load: async ({ store, parseData, renderMarkdown }) => {
      if (!fs.existsSync(CONTENT_DIR)) return;
      const files = fs
        .readdirSync(CONTENT_DIR)
        .filter((f) => f.endsWith('.md'))
        .sort();

      for (const file of files) {
        const id = file.slice(0, -3);
        const abs = path.join(CONTENT_DIR, file);
        const raw = fs.readFileSync(abs, 'utf-8');
        const { data, body } = parseFrontmatter(raw);
        if (!body.trim()) continue; // 空文件（0 字节旧笔记）跳过

        // —— 缺失回退派生 ——
        const h1 = body.match(/^#\s+(.+?)\s*$/m)?.[1] ?? null;
        const title = data.title ?? h1 ?? id;
        const date = data.date ? new Date(data.date) : fs.statSync(abs).mtime;
        if (Number.isNaN(date.getTime())) continue; // 非法日期，跳过
        const tags = data.tags ?? [];
        const minutes = readingMinutes(body);
        const excerpt = excerptFrom(body);

        const parsed = await parseData({
          id,
          data: { title, date, tags, minutes, excerpt },
        });
        const fileURL = new URL(`./content/blog/${file}`, import.meta.url);
        const rendered = await renderMarkdown(body, { fileURL });
        store.set({ id, data: parsed, rendered });
      }
    },
  },
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    minutes: z.number(),
    excerpt: z.string(),
  }),
});

export const collections = { blog };
