
export function createRenderer() {
  /**
   *
   * @param {string} domStr
   * @param {Element} container
   */
  function render(domStr, container) {
    container.innerHTML = domStr;
  }
  return {
    render,
  };
}
