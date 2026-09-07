import './app.css';
import App from './App.svelte';
import { watchAndPersist } from './lib/persistence.js';

watchAndPersist();

const app = new App({ target: document.getElementById('app') });

export default app;
