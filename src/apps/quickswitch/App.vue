<template>
  <div class="quickswitch" :class="{ 'is-visible': show }">
    <div class="header">
      Quick Search
    </div>
    <div class="content">
      <input placeholder="Search through the project..." class="input" type="text" v-model="search">
      <div class="lines">
        <div class="line" @click="onLineClick(line)" v-for="(line, i) in items" :key="i">
          <div :style="{ background: line.icon }" class="icon"></div>
          <div class="text">{{ line.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import tinykeys from 'tinykeys';
import Fuse from 'fuse.js';
import { HTMLToC3UI, UIElement } from '@/tree/tree';

type Item = UIElement & { path: string[] }

export default defineComponent({
  name: 'App',
  components: {
  },
  data() {
    return {
      lines: [] as Item[],
      show: false,
      search: '',
      pageWindow: null as (null | Window),
    };
  },
  computed: {
    items(): Item[] {
      if (!this.search) {
        return this.lines;
      }

      const options = {
        keys: [
          'label',
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
    onLineClick(line: Item): void {
      const clickEvent = document.createEvent('MouseEvents');
      clickEvent.initEvent('dblclick', true, true);

      const elements = document.querySelectorAll('.tree-item-name');
      for (const item of elements) {
        if (item.innerHTML === line.label) {
          item.dispatchEvent(clickEvent);
        }
      }

      this.hideModal();
    },
    hideModal() {
      // console.log('hiding');
      this.show = false;
      this.search = '';
      this.lines = [];
    },
    traverse(
      node: UIElement,
      path: string[] = [],
      result: Item[] = [],
    ) {
      if (!node.children.length) {
        result.push({
          ...node,
          path: path.concat(node.label),
        });
      }
      for (const child of node.children) {
        this.traverse(child, node.type === 'root' ? path : path.concat(node.label), result);
      }
      return result;
    },
    showModal() {
      const project = document.querySelector('#projectBar ui-tree');
      if (project) {
        const ui = HTMLToC3UI(project?.outerHTML);

        const result = this.traverse(ui);

        console.log('result', result);

        this.lines = result;
      }

      this.show = true;
    },
  },
  async mounted() {
    // const port = chrome.runtime.connect();

    window.addEventListener('message', (event) => {
      if (event.data.type === 'CONTEXT') {
        this.pageWindow = event.data.window;
      }
      console.log('app event', event);
    }, false);

    tinykeys(window, {
      '$mod+Shift+K': () => {
        this.showModal();
      },
      escape: () => {
        if (this.show) {
          this.hideModal();
        }
      },
    });
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

  z-index: 1;

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
    height: 100%;
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

    .lines {
      overflow: auto;

      .line {
        height: 24px;
        padding: 16px 8px;
        display: flex;
        font-size: 18px;
        align-items: center;
        cursor: pointer;

        &:hover {
          background-color: #575757;
        }

        .icon {
          min-width: 22px;
          min-height: 20px;
        }
      }
    }
  }
}
</style>
