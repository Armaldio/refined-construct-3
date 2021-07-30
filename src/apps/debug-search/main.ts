import { createApp } from 'vue';
import App from './App.vue';

const observer = new MutationObserver(((mutations, me) => {
  const mainMenuButton = document.getElementById('objectListWrap');
  if (mainMenuButton) {
    const anchor = document.createElement('div');
    anchor.id = 'search-anchor';
    mainMenuButton.appendChild(anchor);

    createApp(App).mount(anchor);

    me.disconnect();
  }
}));

observer.observe(document, {
  childList: true,
  subtree: true,
});
