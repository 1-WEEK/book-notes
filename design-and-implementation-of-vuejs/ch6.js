import { reactive, callEffect } from "./ch5";
import { IS_REF } from "./_enums";

/**
 * @template T
 * @param {T} v
 * @returns {{ value: T }}
 */
export function ref(v) {
  const wrapper = {
    value: v,
    [IS_REF]: true,
  };

  return reactive(wrapper);
}

export { callEffect, reactive };
