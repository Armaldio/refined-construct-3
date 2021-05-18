import { createApp } from 'vue';
import App from './App.vue';
import store from './store';

console.log('Hello from the front!');

const child = document.body;
const anchor = document.createElement('div');
anchor.id = 'quick-switch-anchor';
child.append(anchor);

createApp(App).use(store).mount(anchor);
