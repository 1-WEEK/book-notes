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

export function toRef(v, key) {
  const wrapper = {
    get value() {
      return v[key];
    },
    set value(newV) {
      v[key] = newV;
    },
    [IS_REF]: true,
  };

  return wrapper;
}

export function toRefs(obj) {
  const wrap = {};
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      wrap[key] = toRef(obj, key);
    }
  }
  return wrap;
}

export function proxyRefs(obj) {
  return obj
}

export { callEffect, reactive };
