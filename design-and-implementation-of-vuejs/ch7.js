export class Vnode {
  /** @type {string} */
  type;
  /** @type {string | Vnode} */
  children;
  /**
   *
   * @param {string} type
   * @param {string | Vnode} children
   */
  constructor(type, children) {
    this.type = type;
    this.children = children;
  }
}

export function createRenderer() {
  /**
   *
   * @param {Vnode} vnode
   * @param {Element} container
   */
  function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    if (typeof vnode.children === "string") {
      el.textContent = vnode.children;
    }
    container.appendChild(el);
  }

  /**
   *
   * @param {Vnode} oldVnode
   * @param {Vnode} newVnode
   * @param {Element} container
   */
  function patch(oldVnode, newVnode, container) {
    // TODO: diff
    container.innerHTML = "";
    mountElement(newVnode, container);
  }

  /**
   *
   * @param {Vnode} vnode
   * @param {Element} container
   */
  function render(vnode, container) {
    if (vnode) {
      if (container.__vnode) {
        patch(container.__vnode, vnode, container);
      } else {
        // mount
        mountElement(vnode, container);
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
