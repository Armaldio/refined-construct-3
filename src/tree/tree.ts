/* eslint-disable @typescript-eslint/ban-ts-comment */
import { unified } from 'unified';
import parse from 'rehype-parse';
import {
  Root, Node, Element,
// eslint-disable-next-line import/no-unresolved
} from 'hast';

export class UIElement {
  label = '';

  type: string;

  icon = ''

  isOpened = false

  children: UIElement[] = [];

  selector: string[] = [];

  index = 0;

  constructor(type: string) {
    this.type = type;
  }
}

/*

root
  ui-tree
    ui-treeitem-children 0
      ui-treeitem-children 0

*/

const isElement = (node: Node): node is Element => node.type === 'element';

const getTreeItemWrapInfos = (n: Element) => {
  try {
    // @ts-ignore
    const icon = n.children[1].children[0].properties.style;
    // @ts-ignore
    const label = n.children[1].children[1].children[0].value;

    return { icon, label };
  } catch (e) {
    return {
      icon: '',
      label: 'aaa',
      isOpen: false,
    };
  }
};

const uiTreeItem = (node: Element, index: number, path: string[]): UIElement => {
  const data = new UIElement('ui-treeitem');

  const infos = getTreeItemWrapInfos(node);

  console.log('node.tagName', node);

  data.icon = infos.icon;
  data.label = infos.label;
  data.index = index;
  data.selector = [...path, node.tagName];

  // IMPORTANT
  // log(level, data.label)

  return data;
};

const uiTree = (node: Element, path: string[]) => {
  const data: UIElement[] = [];

  let tree: UIElement | null = null;

  node.children.forEach((n, index) => {
    if (isElement(n) && n.tagName === 'ui-treeitem') {
      // If tree already exist, push it
      // Otherwise, it's our first element
      if (tree) {
        data.push(tree);
      }

      tree = new UIElement('ui-tree');
      const uiTreeItemEl = uiTreeItem(n, index, path);
      tree.icon = uiTreeItemEl.icon;
      tree.label = uiTreeItemEl.label;
      tree.selector.push(n.tagName);
    }

    if (isElement(n) && n.tagName === 'ui-treeitem-children') {
      if (tree) {
        if (n.properties?.collapsed === '') {
          tree.isOpened = false;
        } else {
          tree.isOpened = true;
        }
        tree.selector.push(n.tagName);
        tree.children.push(...uiTree(n, tree.selector));
      }
    }
  });

  if (tree) {
    data.push(tree);
  }

  return data;
};

export const getTree = (node: Root): UIElement => {
  const data = new UIElement('root');

  node.children.forEach((n, index) => {
    if (isElement(n)) {
      if (n.tagName === 'ui-tree') {
        data.selector.push(n.tagName);
        data.children.push(...uiTree(n, data.selector));
      }
    }
  });

  return data;
};

export const HTMLToC3UI = (doc: string): UIElement => {
  const tree = unified()
    .use(parse, { fragment: true })
    .parse(doc) as Root;

  return getTree(tree);
};
