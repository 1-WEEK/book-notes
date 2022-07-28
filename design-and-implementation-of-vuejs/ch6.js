import { reactive, callEffect } from "./ch5";
import { IS_REF } from "./_enums";
import { isRef } from "./_utils";

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
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (isRef(target[key])) {
        return target[key].value;
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, reactive) {
      if (isRef(target[key])) {
        target[key].value = value;
        return true;
      }
      return Reflect.set(target, key, value, receiver);
    },
  });
}

export { callEffect, reactive };
