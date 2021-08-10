<template>
  <dialog
    role="dialog"
    modal
    open
    active
    class="quickswitch"
    :class="{ 'is-visible': show }"
    ref="root"
  >
    <ui-dialog-caption class="header">
      <span class="dialog-caption-text">Quick Search</span>
    </ui-dialog-caption>
    <ui-dialog-contents class="content">
      <input
        @input="resetScroll"
        placeholder="Search through the project..."
        class="search input"
        type="search"
        v-model="search"
        ref="input"
      >
      <span class="input-hint">enter to open</span>
      <!-- , r to rename, d to delete, c to duplicate -->
      <div class="lines" ref="lines">
        <template
          v-for="(line, i) in items" :key="i"
        >
          <div
            class="line"
            :class="{ selected: selected === i }"
            @click="onLineClick(line)"
          >
            <div :style="line.icon" class="icon"></div>
            <div class="text">
              <!-- eslint-disable-next-line -->
              <span class="title" v-html="line.label_highlight || line.label" />
              <span class="subtitle" v-html="line.subtitle_highlight || line.subtitle"></span>
            </div>
          </div>
        </template>
      </div>
    </ui-dialog-contents>
  </dialog>
</template>

<script lang="ts">
// TODO open folder on start to fetch elements

import tinykeys from 'tinykeys';
import { defineComponent } from 'vue';
import Fuse from 'fuse.js';
import { HTMLToC3UI, UIElement } from '@/tree/tree';
// eslint-disable-next-line
import { Element } from 'hast';
import debounceFn from 'debounce-fn';
import { HighlightedObject, highlightElement } from '@/utils';

type Context = 'c3' | 'quickswitch' // | 'something else'

interface ShortcutDefinition {
  key: KeyboardEvent['code'];
  action: (event?: any) => void;
  context: Context;
}

type Item = UIElement & {
  path: string[],
  project: string,
  mode: string;
  action?: any
}

export default defineComponent({
  name: 'App',
  components: {
  },
  data() {
    return {
      $project: null as null | Node,
      lines: [] as Item[],
      show: false,
      search: '',
      pageWindow: null as (null | Window),
      selected: -1,
      context: 'c3' as Context,
    };
  },
  computed: {
    actions() {
      return [
        {
          icon: '',
          label: 'Gestionnaire d\'export',
          subtitle: 'Export your project to various formats',
          mode: 'action',
          action: () => {
            const menuBtn = document.querySelector('#mainMenuButton') as HTMLElement;
            menuBtn.click();
            console.log('menuBtn', menuBtn);
            const menu = document.querySelector('ui-menu') as HTMLElement;
            console.log('menu', menu);
            const vue = (menu.querySelectorAll('ui-menuitem')[2]) as HTMLElement;
            console.log('vue', vue);
            const exportMenu = (vue.querySelectorAll('ui-menuitem')[3]) as HTMLElement;

            console.log('exportMenu', exportMenu);
            exportMenu.click();
            // const menu = document.querySelector('#mainMenuButton') as HTMLElement;
          },
        },
      ];
    },
    items(): HighlightedObject<Item>[] | Item[] {
      const filter = (arr: Item[]) => arr.filter((x) => x.type !== 'root');

      const options = {
        includeMatches: true,
        findAllMatches: true,
        keys: [
          {
            name: 'label',
            weight: 2,
          },
          'subtitle',
        ],
      };

      const allElements = [
        ...filter(this.lines.map((line) => ({
          ...line,
          subtitle: this.joinPath(line.path),
        }))),
        // ...this.actions,
      ];

      if (!this.search) {
        return allElements;
      }

      const fuse = new Fuse(allElements, options);
      const result = fuse.search(this.search);
      console.log('result', result);
      return result.map((element) => highlightElement(element));
    },
  },
  methods: {
    setupProject(project: Node, open = false) {
      // @ts-ignore
      const ui = HTMLToC3UI(project);

      console.log('ui', ui);

      const result = this.traverse(ui, [], [], true);

      console.log('result', result);

      this.lines = result;
    },
    onProjectReady(project: Node) {
      if (project) {
        this.setupProject(project, true);

        const observer = new MutationObserver(debounceFn(() => {
          this.setupProject(project);
        }, {
          wait: 500,
        }));

        observer.observe(project, {
          attributes: true,
          childList: true,
          subtree: true,
          characterDataOldValue: true,
        });
      }
    },
    joinPath(path: string[]) {
      return path.join(' > ');
    },
    resetScroll() {
      const el = this.$refs.lines as Element;
      el.scrollTop = 0;
      this.selected = 0;
    },
    onLineClick(line: Item): void {
      if (line.mode === 'action') {
        line.action();
        //
      } else if (line.mode === 'projectItem') {
        if (line.isLeaf && !line.isFolder) {
          console.log('line', line);
          const clickEvent = document.createEvent('MouseEvents');
          clickEvent.initEvent('dblclick', true, true);

          if (line.reference) {
            line.reference.querySelector('.tree-item-wrap')?.dispatchEvent(clickEvent);
          }
        } else if (line.reference && line.isFolder) {
          const intersectionObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
              intersectionObserver.disconnect();
              setTimeout(() => {
                line.reference?.classList.add('flash');
                setTimeout(() => {
                  line.reference?.classList.remove('flash');
                }, 250);
              }, 250);
            }
          });
          // start observing
          intersectionObserver.observe(line.reference);

          (line.reference as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else {
          console.log('line', line);
        }

        this.hideModal();
      }
    },
    addDimmer() {
      const dimmer = document.createElement('div');
      dimmer.classList.add('c3-dimmer');
      dimmer.style.zIndex = '0';
      document.body.appendChild(dimmer);
    },
    removeDimmer() {
      const dimmer = document.querySelector('.c3-dimmer') as HTMLElement;
      if (dimmer) {
        dimmer.remove();
      }
    },
    hideModal() {
      this.context = 'c3';

      this.selected = -1;
      this.show = false;
      this.search = '';
      this.removeDimmer();
    },
    traverse(
      node: UIElement,
      path: string[] = [],
      result: Item[] = [],
      open = false,
    ) {
      // console.log('node', node);
      if (node?.reference && open && !node.isOpened && node.isLeaf) {
        console.log('opening ', node.label);
        const clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent('dblclick', true, true);

        node.reference.dispatchEvent(clickEvent);
        node.reference.dispatchEvent(clickEvent);
      }

      // console.log('node', node);
      // console.log('path', path);
      // if (!node.children.length) {
      result.push({
        ...node,
        path: path.concat(node.label),
        project: path[0],
        mode: 'projectItem',
      });
      // }
      for (const child of node.children) {
        this.traverse(child, node.type === 'root' ? path : path.concat(node.label), result);
      }
      return result;
    },
    showModal() {
      this.context = 'quickswitch';

      if (this.$refs.input) {
        (this.$refs.input as HTMLInputElement).focus();
      }
      this.show = true;
      this.addDimmer();
    },
  },
  created() {
    const shortcuts: ShortcutDefinition[] = [
      {
        key: 'ArrowUp',
        action: () => {
          if (this.selected > 0) {
            this.selected -= 1;
          }

          const ref = this.$refs.lines as HTMLElement;
          const selectedLine = ref.querySelector('.selected');
          if (selectedLine) {
            selectedLine.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }

          console.log('this.selected', this.selected, this.items[this.selected]);
        },
        context: 'quickswitch',
      },
      {
        key: 'Enter',
        action: () => {
          this.onLineClick(this.items[this.selected]);
          console.log('this.selected', this.selected, this.items[this.selected]);
        },
        context: 'quickswitch',
      },
      {
        key: 'ArrowDown',
        action: () => {
          if (this.selected < this.items.length - 1) {
            this.selected += 1;
          }
          const ref = this.$refs.lines as HTMLElement;
          const selectedLine = ref.querySelector('.selected');
          if (selectedLine) {
            selectedLine.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
          console.log('this.selected', this.selected, this.items[this.selected]);
        },
        context: 'quickswitch',
      },
      {
        key: 'Escape',
        action: () => {
          this.hideModal();
        },
        context: 'quickswitch',
      },
    ];

    document.addEventListener('keydown', (event) => {
      const contextShortcuts = shortcuts.filter((shortcut) => shortcut.context === this.context);

      const keyShortcuts = contextShortcuts.filter(({ key }) => key === event.code);

      for (let i = 0; i < keyShortcuts.length; i += 1) {
        // execture action
        keyShortcuts[i].action(event);
      }

      if (this.context !== 'c3') {
        // event.cancelBubble = true;
        event.stopImmediatePropagation();
      }
    });

    tinykeys(window, {
      '$mod+Shift+K': () => {
        this.showModal();
      },
    });
  },
  async mounted() {
    const stop = setInterval(() => {
      const project = document.querySelector('#projectBar ui-tree');
      console.log('project', project);

      if (project) {
        this.$project = project;
        this.onProjectReady(project);
        clearInterval(stop);
      }
    }, 100);

    window.addEventListener('message', (event) => {
      if (event.data.type === 'CONTEXT') {
        this.pageWindow = event.data.window;
      }
      // console.log('app event', event);
    }, false);
  },
});
</script>

<style lang="scss">
.quickswitch {

  z-index: 1;
  margin: 0px;
  position: absolute;
  left: 0px;
  top: 0px;
  // transform: translate(233px, 144px);

  display: flex;
  flex-direction: column;

  position: fixed;
  width: 80%;

  transform: translate(-50%, -50%);
  left: 50%;
  top: 50%;
  // border: 1px solid #000;
  // border-radius: 4px;
  background-color: #474747;

  // z-index: 999999;

  transition: opacity 250ms ease-in-out;
  height: 0;
  opacity: 0;
  pointer-events: none;

  &.is-visible {
    pointer-events: all;
    opacity: 1;
    height: 450px;
  }

  .header {
    background: #696969;
    height: 25px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D9D9D9;
  }

  .content {
    height: calc(100% - 48px);
    display: flex;
    flex-direction: column;

    .input {
      background: #303030;
      padding: 0 8px;
      border-radius: 3px;
      border: 0;
      height: 50px;
      margin: 10px;
      box-sizing: border-box;
      display: inline-block;
      line-height: 50px;
      font-size: 24px;
      padding: 8px;
      color: #b8b8b8;
    }

    .input-hint {
      margin-left: 0 0 0 8px;
      color: grey;
      font-size: 12px;
      text-align: left;
    }

    .lines {
      overflow: auto;

      .line {
        padding: 4px 8px;
        display: flex;
        font-size: 18px;
        align-items: center;
        cursor: pointer;

        &.selected,
        &:hover {
          background-color: #696969;

          .text {
            .subtitle {
              color: #D9D9D9;
            }
          }
        }

        .icon {
          min-width: 22px;
          min-height: 20px;
        }

        .text {
          display: flex;
          flex-direction: column;
          text-align: left;

          span {
            margin: 0 0 0 8px;
          }

          .highlight-bg {
            color: #2fcc63;
            margin: 0;
          }

          .subtitle {
            font-size: 10px;
            color: grey;
          }
        }
      }
    }
  }
}

ui-treeitem {
  transition: background-color .25s ease !important;
  background-color: inherit;

  &.flash {
    background-color: rgba(255, 0, 0, 0.7);
    // transition: background-color 2s ease;
  }
}

</style>
