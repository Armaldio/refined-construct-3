<template>
  <div class="quickswitch" :class="{ 'is-visible': show }" ref="root">
    <div class="header">
      Quick Search
    </div>
    <div class="content">
      <input
        @input="resetScroll"
        placeholder="Search through the project.."
        class="input"
        type="text"
        v-model="search"
        ref="input"
      >
      <span class="input-hint">enter to open, r to rename, d to delete, c to duplicate</span>
      <div class="lines" ref="lines">
        <div
          class="line"
          :class="{ selected: selected === i }"
          @click="onLineClick(line)"
          v-for="(line, i) in items" :key="i"
        >
          <div :style="line.icon" class="icon"></div>
          <div class="text">
            <span class="title">{{ line.label }}</span>
            <span class="subtitle">{{ joinPath(line.path) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// TODO flash element on scroll to view
// TODO open folder on start to fetch elements

import tinykeys from 'tinykeys';
import { defineComponent } from 'vue';
import Fuse from 'fuse.js';
import { HTMLToC3UI, UIElement } from '@/tree/tree';
// eslint-disable-next-line
import { Element } from 'hast';
import debounceFn from 'debounce-fn';

type Context = 'c3' | 'quickswitch' // | 'something else'

interface ShortcutDefinition {
  key: KeyboardEvent['code'];
  action: (event?: any) => void;
  context: Context;
}

type Item = UIElement & {
  path: string[],
  project: string,
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
    items(): Item[] {
      if (!this.search) {
        return this.lines;
      }

      const options = {
        keys: [
          {
            name: 'label',
            weight: 2,
          },
          'path',
        ],
      };

      const fuse = new Fuse(this.lines, options);
      const result = fuse.search(this.search);
      console.log('result', result);
      return result.map((r) => r.item);
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
    },
    onLineClick(line: Item): void {
      if (line.isLeaf) {
        console.log('line', line);
        const clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent('dblclick', true, true);

        if (line.reference) {
          line.reference.querySelector('.tree-item-wrap')?.dispatchEvent(clickEvent);
        }
      } else {
        // this.$project
        (line.reference as HTMLElement | null)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      this.hideModal();
    },
    hideModal() {
      this.context = 'c3';

      this.selected = -1;
      this.show = false;
      this.search = '';
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
          if (this.selected < this.items.length) {
            this.selected += 1;
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
  position: fixed;
  width: 80%;

  transform: translate(-50%, -50%);
  left: 50%;
  top: 50%;
  border: 1px solid #000;
  border-radius: 4px;
  background-color: #474747;

  z-index: 999999;

  transition: height 150ms ease-in-out, opacity 150ms ease-in-out;
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
    height: calc(100% - 25px);
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
      margin-left: 8px;
      color: grey;
      font-size: 12px;
    }

    .lines {
      overflow: auto;

      .line {
        padding: 4px 8px;
        display: flex;
        font-size: 18px;
        align-items: center;
        cursor: pointer;

        &.selected {
          background-color: grey;
        }

        &:hover {
          background-color: #575757;
        }

        .icon {
          min-width: 22px;
          min-height: 20px;
        }

        .text {
          display: flex;
          flex-direction: column;
          margin-left: 8px;

          .subtitle {
            font-size: 10px;
            color: grey;
          }
        }
      }
    }
  }
}
</style>
