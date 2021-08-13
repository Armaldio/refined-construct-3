<template>
  <div class="debug-search">
    <input
      placeholder="Search..."
      class="input"
      @input="inputChangeHandler"
      type="search"
      v-model="search"
    >
  </div>
</template>

<script lang="ts">
import { PREFIX } from '@/utils';
import { defineComponent } from 'vue';
import Fuse from 'fuse.js';

export default defineComponent({
  name: 'App',
  components: {
  },
  data() {
    return {
      search: '',
      localStorageItemKeyName: `${PREFIX}DebuggerSearchbarValue`,
      list: null as Element | null,
    };
  },
  methods: {
    inputChangeHandler() {
      localStorage.setItem(this.localStorageItemKeyName, this.search);

      if (this.list) {
        const options = {
          keys: [
            'label',
          ],
          threshold: 0.3,
        };

        const elements = Array.from(this.list.children).map((el) => {
          const element = el as HTMLElement;
          const text = (element.querySelector('.item a') as HTMLElement | undefined)?.innerText;
          return {
            label: text,
            reference: element,
          };
        });

        const fuse = new Fuse(elements, options);
        const result = fuse.search(this.search);
        const matches = result.map((r) => r.item.label);

        for (let i = 0; i < this.list.children.length; i += 1) {
          const child = this.list.children[i] as HTMLElement;
          const text = (child.querySelector('.item a') as HTMLElement | undefined)?.innerText;
          if (text) {
            if (this.search === '') {
              child.style.display = '';
            } else {
              child.style.display = matches.includes(text) ? '' : 'none';
            }
          }
        }
      }
    },
  },
  async mounted() {
    this.list = document.querySelector('#objectList');
    if (!this.list) {
      return;
    }

    // localstorage store old value
    const previousValue = localStorage.getItem(this.localStorageItemKeyName);
    if (previousValue) {
      this.search = previousValue;
    }
    if (this.list.children.length > 0) {
      this.inputChangeHandler();
    }

    const subObserver = new MutationObserver((mutations, me) => {
      if (mutations.length > 0) {
        this.inputChangeHandler();
      }
    });
    subObserver.observe(this.list, {
      childList: true,
      subtree: true,
    });
  },
});
</script>

<style lang="scss">
.debug-search {
  .input {
    width: 100%;
  }
}
</style>
