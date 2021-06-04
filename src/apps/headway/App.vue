<template>
  <div v-show="!hideIcon" id="announce-headway">
    🆕
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import widget from './widget';

export default defineComponent({
  name: 'App',
  components: {
  },
  data() {
    return {
      hideIcon: true,
    };
  },
  async mounted() {
    // DO NOT REMOVE THIS LINE
    console.log('widget', widget);

    window.addEventListener('message', (event) => {
      if (event.data.length === 3 && event.data[1] === 'widgetReady') {
        const infos = event.data[2][0];

        if (infos.badgeCount > 0) {
          this.hideIcon = false;
        }
      }
    }, false);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Headway.init({
      selector: '#announce-headway',
      account: 'JRpALx',
      callbacks: {
        onHideWidget: () => {
          console.log('on hide widget');
          this.hideIcon = true;
        },
      },
    });
  },
});
</script>

<style lang="scss">
#HW_badge_cont {
  position: absolute;
  top: -6px;
  right: 1px;
  width: 100%;
  height: 100%;
}

#announce-headway {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
}
</style>
