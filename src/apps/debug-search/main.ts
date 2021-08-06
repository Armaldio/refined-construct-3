import { createApp } from 'vue';
import App from './App.vue';

const observer = new MutationObserver(((mutations, me) => {
  const mainMenuButton = document.getElementById('mainTitle');
  const objectList = document.getElementById('objectList');
  if (mainMenuButton && objectList) {
    const anchor = document.createElement('div');
    anchor.id = 'search-anchor';
    mainMenuButton.insertAdjacentElement('afterend', anchor);

    createApp(App).mount(anchor);

    me.disconnect();
  }
}));

observer.observe(document, {
  childList: true,
  subtree: true,
});
