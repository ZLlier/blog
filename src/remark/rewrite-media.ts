// remark 插件：把文章里的相对图片路径 ./media/xxx 重写为站点路径 /media/xxx
// 只处理真正的图片节点（AST 层面），不会误伤代码块里的文本
import type { RemarkPlugin } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';

export const remarkRewriteMedia: RemarkPlugin = () => (tree) => {
  visit(tree, 'image', (node: { url?: string }) => {
    const url = node.url ?? '';
    if (/^(\.\/)?media\//.test(url)) {
      node.url = url.replace(/^(\.\/)?media\//, '/media/');
    }
  });
};
