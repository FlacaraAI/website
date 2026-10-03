// Mounts the FeralUI flow gradient (feral-flow.jsx, exported from
// feralui.dev/gradients) into every [data-feral-gradient] element.
// Build: cd tools/gradient && npm run build  →  /feral-gradient.js
import { render } from 'preact';
import Gradient from './feral-flow.jsx';

function mount() {
  document.querySelectorAll('[data-feral-gradient]').forEach(function (el) {
    render(
      <Gradient style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', aspectRatio: 'auto' }} />,
      el
    );
    // let the static image underneath hand over once the field has painted
    var live = function () { el.classList.add('is-live'); };
    requestAnimationFrame(function () { requestAnimationFrame(live); });
    setTimeout(live, 120); // in case frames are throttled (background tab)
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
