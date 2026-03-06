/**
 * Layout Inspector — solo DEV.
 * Ayuda a identificar el contenedor real que controla una tarjeta u overlay.
 *
 * Uso en consola:
 *   __WAITME_LAYOUT_INSPECTOR__.inspect(document.querySelector('.selector'))
 *   __WAITME_LAYOUT_INSPECTOR__.inspectLastClicked()
 *
 * Para inspeccionar el último elemento clickeado, activar primero:
 *   __WAITME_LAYOUT_INSPECTOR__.enableClickCapture()
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const getStyles = (el) => {
    if (!el || !el.getBoundingClientRect) return null;
    const cs = window.getComputedStyle(el);
    return {
      element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ').slice(0, 3).join('.') : ''),
      className: el.className || '',
      zIndex: cs.zIndex,
      position: cs.position,
      bottom: cs.bottom,
      top: cs.top,
      left: cs.left,
      right: cs.right,
      transform: cs.transform,
      marginBottom: cs.marginBottom,
      paddingBottom: cs.paddingBottom,
      display: cs.display,
      flexDirection: cs.flexDirection,
      justifyContent: cs.justifyContent,
    };
  };

  let lastClicked = null;
  const clickHandler = (e) => {
    lastClicked = e.target;
  };

  window.__WAITME_LAYOUT_INSPECTOR__ = {
    inspect(el) {
      const target = el || lastClicked;
      if (!target) {
        console.warn('[LayoutInspector] No element. Use: inspect(document.querySelector("...")) or enableClickCapture() + click');
        return null;
      }
      const info = getStyles(target);
      console.table ? console.table(info) : console.log(info);
      return info;
    },

    inspectTree(el, depth = 3) {
      const target = el || lastClicked;
      if (!target) return null;
      let node = target;
      const results = [];
      for (let i = 0; i < depth && node; i++) {
        results.push(getStyles(node));
        node = node.parentElement;
      }
      console.log('[LayoutInspector] Tree (element → parent → ...):', results);
      return results;
    },

    enableClickCapture() {
      document.addEventListener('click', clickHandler, true);
      console.log('[LayoutInspector] Click capture ON. Click an element, then inspectLastClicked()');
    },

    disableClickCapture() {
      document.removeEventListener('click', clickHandler, true);
      console.log('[LayoutInspector] Click capture OFF');
    },

    inspectLastClicked() {
      return this.inspect(lastClicked);
    },
  };
}
