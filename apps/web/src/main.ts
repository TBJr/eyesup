import { mount } from 'svelte';
import App from './App.svelte';
import '@eyesup/tokens/tokens.css';
import './app.css';

const target = document.getElementById('app');

if (!target) {
  console.error('EyesUp: #app element missing');
} else {
  try {
    // Replace the static boot fallback so we never leave two <h1>EyesUp</h1>s in the DOM.
    target.replaceChildren();
    mount(App, { target });
  } catch (err) {
    console.error('EyesUp: failed to mount', err);
    target.replaceChildren();
    const main = document.createElement('main');
    main.className = 'boot-fallback';
    const h1 = document.createElement('h1');
    h1.textContent = 'EyesUp';
    const p = document.createElement('p');
    p.textContent =
      'Something went wrong while starting the app. Check the browser console, then reload.';
    main.append(h1, p);
    target.append(main);
  }
}
