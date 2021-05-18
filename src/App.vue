<template>
  <div class="quickswitch" :class="{ 'is-visible': show }">
    <div class="content">
      <input class="input" type="text">
      <div class="lines">
        <div class="line" @click="onLineClick(line)" v-for="(line, i) in lines" :key="i">
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

interface Item {
  dom: Node;
  icon: string;
  label: string;
}

export default defineComponent({
  name: 'App',
  components: {
  },
  data() {
    return {
      lines: [] as Item[],
      show: false,
    };
  },
  methods: {
    onLineClick(line: Item): void {
      const clickEvent = document.createEvent('MouseEvents');
      clickEvent.initEvent('dblclick', true, true);
      line.dom.dispatchEvent(clickEvent);

      this.hideModal();
    },
    hideModal() {
      console.log('hiding');
      this.show = false;
    },
    showModal() {
      console.log('showing');

      const $items = document.querySelectorAll('ui-treeitem');
      console.log('items', $items);

      $items.forEach((item) => {
        if (!item) {
          console.log('no item');
          return;
        }

        const wrap = item.querySelector('.tree-item-wrap');
        if (!wrap) {
          console.log('no wrap');
          return;
        }

        const $text = wrap.querySelector('.tree-item-name');
        const $icon = wrap.querySelector('ui-icon');

        let icon = '';
        const label = $text?.innerHTML ?? '';

        console.log('label', label);

        if ($icon) {
          console.log('getComputedStyle($icon)', getComputedStyle($icon));
          icon = getComputedStyle($icon).background;
        }

        // console.log('icon.style', icon.style);

        this.lines.push({
          dom: wrap,
          icon,
          label,
        });
      });

      this.show = true;
    },
  },
  mounted() {
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

  display: none;
  height: 0;
  transition: height 350ms ease-in-out;
  z-index: 1;

  &.is-visible {
    display: block;
    height: 250px;
  }

  .content {
    height: 100%;
    display: flex;
    flex-direction: column;

    .input {
      background: #303030;
      padding: 0;
      border: 0;
      height: 50px;
      outline: 1px solid grey;
      margin: 10px;
      box-sizing: border-box;
      display: inline-block;
      line-height: 50px;
      font-size: 24px;
      padding: 8px;
      color: black;
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
