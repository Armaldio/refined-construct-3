export class UIElement {
  label = '';

  type: string;

  icon = ''

  isOpened = false

  isLeaf = true

  isFolder = false

  children: UIElement[] = [];

  reference: Element | null = null;

  constructor(type: string) {
    this.type = type;
  }
}

const isElement = (node: Node): node is Element => true;

const getTreeItemWrapInfos = (n: Element) => {
  try {
    const icon = (n.childNodes[1].childNodes[0] as HTMLElement).style.cssText;
    const label = (n.childNodes[1].childNodes[1] as HTMLElement).textContent ?? '';

    return { icon, label };
  } catch (e) {
    return {
      icon: '',
      label: 'aaa',
      isOpen: false,
    };
  }
};

const uiTreeItem = (node: Element): UIElement => {
  const data = new UIElement('ui-treeitem');

  const infos = getTreeItemWrapInfos(node);

  data.icon = infos.icon;
  data.label = infos.label;
  data.reference = node;

  return data;
};

const uiTree = (node: Element) => {
  const data: UIElement[] = [];

  let tree: UIElement | null = null;

  node.childNodes.forEach((n) => {
    if (isElement(n) && n.tagName === 'UI-TREEITEM') {
      // If tree already exist, push it
      // Otherwise, it's our first element
      if (tree) {
        data.push(tree);
      }

      tree = new UIElement('ui-tree');
      const uiTreeItemEl = uiTreeItem(n);
      tree.icon = uiTreeItemEl.icon;
      tree.label = uiTreeItemEl.label;
      tree.reference = n;

      if (n.classList.contains('fileGroup') || n.classList.contains('parentItem')) {
        tree.isFolder = true;
      }
    }

    if (isElement(n) && n.tagName === 'UI-TREEITEM-CHILDREN') {
      if (tree) {
        tree.isLeaf = false;

        if (n.hasAttribute('collapsed')) {
          tree.isOpened = false;
        } else {
          tree.isOpened = true;
        }
        tree.children.push(...uiTree(n));
      }
    }
  });

  if (tree) {
    data.push(tree);
  }

  return data;
};

export const HTMLToC3UI = (project: HTMLElement): UIElement => {
  const data = new UIElement('root');

  data.reference = project;
  data.children.push(...uiTree(project));

  return data;
};
