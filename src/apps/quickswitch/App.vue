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
        <!-- <VirtualList :data="items">
          <template v-slot="{ item, index }">
            <div
              class="line"
              :class="{ selected: selected === index }"
              @click="onLineClick(item)"
            >
              <ui-icon :style="item.icon" class="icon"></ui-icon>
              <div class="text">
                <span class="title" v-html="item.label_highlight || item.label" />
                <span class="subtitle" v-html="item.subtitle_highlight || item.subtitle"></span>
              </div>
            </div>
          </template>
        </VirtualList> -->
        <template v-for="(item, index) in items" :key="index">
          <!-- <pre>{{ item }}</pre> -->
          <div
            class="line"
            :class="{ selected: selected === index }"
            @click="onLineClick(item)"
          >
            <ui-icon :style="item.icon" class="icon"></ui-icon>
            <div class="text">
              <!-- eslint-disable-next-line -->
              <span class="title" v-html="item.label_highlight || item.label" />
              <span class="subtitle" v-html="item.subtitle_highlight || item.subtitle"></span>
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
import { VirtualList } from 'vue3-virtual-list';

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
  action?: any;
  subtitle?: string;
}

export default defineComponent({
  name: 'App',
  components: {
    // VirtualList,
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
            const menu = document.querySelector('ui-menu') as HTMLElement;
            const vue = (menu.querySelectorAll('ui-menuitem')[2]) as HTMLElement;
            const exportMenu = (vue.querySelectorAll('ui-menuitem')[3]) as HTMLElement;

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
        ...filter(this.lines),
        // ...this.actions,
      ];

      if (!this.search) {
        return allElements;
      }

      const fuse = new Fuse(allElements, options);
      const result = fuse.search(this.search);
      return result.map((element) => highlightElement(element));
    },
  },
  methods: {
    setupProject(project: Node, open = false) {
      // @ts-ignore
      const ui = HTMLToC3UI(project);

      const result = this.traverse(ui, [], [], true);

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
      if (node?.reference && open && !node.isOpened && node.isLeaf) {
        const clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent('dblclick', true, true);

        node.reference.dispatchEvent(clickEvent);
        node.reference.dispatchEvent(clickEvent);
      }

      // if (!node.children.length) {
      const p = path.concat(node.label);
      result.push({
        ...node,
        path: p,
        subtitle: this.joinPath(p),
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
        },
        context: 'quickswitch',
      },
      {
        key: 'Enter',
        action: () => {
          this.onLineClick(this.items[this.selected]);
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
  // background-color: #474747;

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
    height: 25px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    height: calc(100% - 48px);
    display: flex;
    flex-direction: column;

    .input {
      // background: #303030;
      border-radius: 3px;
      border: 0;
      height: 50px;
      margin-bottom: 16px;
      box-sizing: border-box;
      display: inline-block;
      line-height: 50px;
      font-size: 24px;
      padding: 3px 48px 3px 48px;
      // color: #b8b8b8;

      background-position: 8px 10px;
      background-size: 32px 32px;
      background-repeat: no-repeat;

    }

    .input-hint {
      margin-left: 0 0 0 8px;
      // color: grey;
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
              // color: #D9D9D9;
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
