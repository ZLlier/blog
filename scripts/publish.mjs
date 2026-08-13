// 雾岛发布脚本
// 用法：npm run publish -- <文件名>       例：npm run publish -- Git.md
//       npm run publish -- <文件名> --force   覆盖已发布的同名文章
// 做什么：把笔记目录里的 md + 它的 media/<文件名>/ 图片文件夹一起复制进博客 content，
//         并补齐 frontmatter（缺 title 取正文 H1，缺 date 取今天），防止"只发文字漏图片"。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTE_ROOTS, BLOG_CONTENT_DIR } from './publish.config.mjs';

// ---------- 小工具 ----------
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { data: {}, body: raw };
  const fm = match[1];
  const body = raw.slice(match[0].length);
  const data = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const value = m[2].trim();
    if (key === 'tags') {
      if (value.startsWith('[') && value.endsWith(']')) {
        data.tags = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      } else if (value) {
        data.tags = [value];
      }
    } else {
      data[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  if (!data.tags) {
    const lines = fm.split(/\r?\n/);
    const idx = lines.findIndex((l) => /^tags:\s*$/.test(l));
    if (idx >= 0) {
      const tags = [];
      for (const l of lines.slice(idx + 1)) {
        const item = l.match(/^\s*-\s+(.+)$/);
        if (item) tags.push(item[1].trim());
        else if (/^\S/.test(l)) break;
      }
      if (tags.length) data.tags = tags;
    }
  }
  return { data, body };
}

function yamlValue(s) {
  const str = String(s ?? '');
  if (/^[-0-9]|[:#]|^$/.test(str) || /^['"!&*?|>@`]/.test(str) || /[\s:]$/.test(str)) {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return str;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- 主流程 ----------
const args = process.argv.slice(2);
const force = args.includes('--force');
const target = args.find((a) => !a.startsWith('--'));

if (!target) {
  console.error('用法：npm run publish -- <文件名> [--force]');
  process.exit(1);
}

const name = target.replace(/\.md$/i, '');
const fileName = name + '.md';

// 1. 在笔记目录里找文件
let source = null;
let sourceRoot = null;
for (const root of NOTE_ROOTS) {
  const p = path.join(root, fileName);
  if (fs.existsSync(p)) {
    source = p;
    sourceRoot = root;
    break;
  }
}
if (!source) {
  console.error(`✗ 在笔记目录里找不到 ${fileName}：`);
  for (const root of NOTE_ROOTS) console.error(`    ${path.join(root, fileName)}`);
  console.error('  如果文件在别处，请把完整路径写进 scripts/publish.config.mjs 的 NOTE_ROOTS。');
  process.exit(1);
}

// 2. 读取并解析
const raw = fs.readFileSync(source, 'utf-8');
const { data, body } = parseFrontmatter(raw);
if (!body.trim()) {
  console.error(`✗ ${fileName} 是空文件，跳过。`);
  process.exit(1);
}
const h1 = body.match(/^#\s+(.+?)\s*$/m)?.[1] ?? null;
const title = data.title ?? h1 ?? name;
const date = data.date ?? today();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.warn(`⚠ frontmatter 里的 date 不是 YYYY-MM-DD 格式（当前：${date}），博客会跳过这篇文章。`);
}
const tags = data.tags ?? [];

// 3. 组装规范的 frontmatter
const fmLines = ['---', `title: ${yamlValue(title)}`, `date: ${date}`];
if (tags.length) {
  fmLines.push('tags:');
  for (const t of tags) fmLines.push(`  - ${yamlValue(t)}`);
}
const output = fmLines.join('\n') + '\n---\n' + body;

// 4. 安全：目标已存在时不覆盖
const dest = path.join(BLOG_CONTENT_DIR, fileName);
if (fs.existsSync(dest) && !force) {
  console.error(`✗ ${fileName} 已经在博客里了。确认要覆盖请加 --force。`);
  process.exit(1);
}

// 5. 复制 md + media 图片文件夹
fs.mkdirSync(BLOG_CONTENT_DIR, { recursive: true });
fs.writeFileSync(dest, output, 'utf-8');

const mediaSrc = path.join(sourceRoot, 'media', name);
let mediaCount = 0;
if (fs.existsSync(mediaSrc)) {
  const mediaDest = path.join(BLOG_CONTENT_DIR, 'media', name);
  fs.cpSync(mediaSrc, mediaDest, { recursive: true, force: true });
  mediaCount = fs.readdirSync(mediaSrc).length;
}

// 6. 总结
console.log('──────────────────────────────');
console.log(`✓ 已发布：${title}`);
console.log(`  日期：${date}${data.date ? '（沿用 frontmatter）' : '（今天，未写 frontmatter）'}`);
console.log(`  标签：${tags.length ? tags.join('、') : '（无）'}`);
console.log(`  媒体：${mediaCount} 个文件${mediaCount ? '（media/' + name + '/）' : ''}`);
console.log('──────────────────────────────');
console.log('下一步：');
console.log('  cd D:\\Mine\\Code\\Zcode\\Blog');
console.log('  git add . && git commit -m "发布：' + title + '" && git push');
