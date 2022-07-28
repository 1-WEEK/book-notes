/**
 *
 * @param {string} oldVnode
 * @param {string} newVnode
 * @param {Element} container
 */
function patch(oldVnode, newVnode, container) {
  container.innerHTML = newVnode;
}

export function createRenderer() {
  /**
   *
   * @param {string} domStr
   * @param {Element} container
   */
  function render(vnode, container) {
    if (vnode) {
      if (container.__vnode) {
        patch(container.__vnode, vnode, container);
      } else {
        // mount
        container.innerHTML = vnode;
      }
    } else {
      // unmount
      if (container.__vnode) container.innerHTML = "";
    }
    container.__vnode = vnode;
  }
  return {
    render,
  };
}
