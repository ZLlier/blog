// 文章派生工具：阅读时长、摘要（frontmatter 缺失时回退用）

/** 按中文字符 + 英文单词估算阅读分钟数（中文 ~300 字/分） */
export function readingMinutes(text: string): number {
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) ?? []).length;
  const latin = (text.replace(/[\u4e00-\u9fff\u3040-\u30ff]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  const total = cjk + latin * 0.7;
  return Math.max(1, Math.round(total / 300));
}

/** 取正文第一段非标题文本做摘要（去 markdown 符号，截断） */
export function excerptFrom(body: string, max = 120): string {
  const first = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !/^#{1,6}\s/.test(l) && !/^!\[/.test(l) && !/^```/.test(l) && !/^<\//.test(l));
  if (!first) return '';
  const plain = first.replace(/[#>*_`\[\]()]/g, '');
  return plain.length > max ? plain.slice(0, max) + '…' : plain;
}

/** 2026-08-13 格式的日期 */
export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
