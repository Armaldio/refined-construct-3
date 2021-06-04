import { createApp } from 'vue';
import App from './App.vue';

const child = document.body;
const anchor = document.createElement('div');
anchor.id = 'quick-switch-anchor';
child.append(anchor);

createApp(App).mount(anchor);
