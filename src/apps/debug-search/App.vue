<template>
  <div class="debug-search">
    <input placeholder="Search..." class="input" type="text" v-model="text">
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App',
  components: {
  },
  data() {
    return {
      text: 'text',
    };
  },
  async mounted() {
    //
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
