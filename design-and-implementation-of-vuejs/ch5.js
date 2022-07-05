const ITERATE_KEY = Symbol();
const ORIGIN = Symbol();

const utils = {
  isSame(oldVal, newVal) {
    return oldVal !== newVal || (oldVal !== oldVal && newVal !== newVal);
  },
  getOrigin(v) {
    return v[ORIGIN] || v;
  },
  isReactive(v) {
    return !!v[ORIGIN];
  },
  isMap(o) {
    return Object.prototype.toString.call(o) === "[object Map]";
  },
};

let activeEffect;
let skipTrack = false;
const effectStack = [];

function cleanup(effect) {
  effect.deps.forEach((deps) => {
    deps.delete(effect);
  });
  effect.deps.length = 0;
}

export function callEffect(fn, options = {}) {
  const effect = () => {
    cleanup(effect);
    activeEffect = effect;
    effectStack.push(effect);
    const result = fn();
    effectStack.pop(effect);
    activeEffect = effectStack[effectStack.length - 1];
    return result;
  };
  effect.deps = [];
  effect.options = options;
  if (options.lazy) {
    return effect;
  }
  effect();
}

// 防止 target 无法被 GC 回收
let bucket = new WeakMap();
const reactiveMap = new Map();

const arrayInstrumentations = {};
["includes", "indexOf", "lastIndexOf"].forEach((method) => {
  arrayInstrumentations[method] = function (...args) {
    const originMethod = Array.prototype[method];
    let result = originMethod.apply(this, args);
    if (typeof result === "number" && result < 0) {
      result = false;
    }
    if (result === false) {
      result = originMethod.apply(this[ORIGIN], args);
    }
    return result;
  };
});
["push", "pop", "shift", "unshift", "splice"].forEach((method) => {
  arrayInstrumentations[method] = function (...args) {
    const originMethod = Array.prototype[method];
    skipTrack = true;
    let result = originMethod.apply(this, args);
    skipTrack = false;
    return result;
  };
});

function createReactive(o, isShallow = false, isReadonly = false) {
  return new Proxy(o, {
    get(target, key, receiver) {
      if (key === ORIGIN) {
        return target;
      }

      if (!isReadonly && typeof key !== "symbol") {
        track(target, key);
      }

      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }

      const property = Reflect.get(target, key, receiver);
      if (isShallow) {
        return property;
      }
      if (typeof property === "object" && property !== null) {
        return isReadonly ? readonly(property) : reactive(property);
      }

      // 避免 getter 访问原对象导致无法正确收集依赖
      return property;
    },
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      track(target, Array.isArray(target) ? "length" : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    set(target, key, newVal, receiver) {
      if (isReadonly) {
        console.warn(`property ${key} is readonly`);
        return true;
      }
      const isArray = Array.isArray(target);
      const type = isArray
        ? Number(key) >= target.length
          ? "ADD"
          : "SET"
        : Object.prototype.hasOwnProperty.call(target, key)
        ? "SET"
        : "ADD";
      const oldVal = target[key];
      const result = Reflect.set(
        target,
        key,
        utils.getOrigin(newVal),
        receiver
      );

      if (target === receiver[ORIGIN]) {
        if (!utils.isSame(newVal, oldVal)) {
          trigger(target, key, type, newVal);
        }
      }
      // > The set() method should return a boolean value.
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set#return_value
      return result;
    },
    deleteProperty(target, key) {
      if (isReadonly) {
        console.warn(`property ${key} is readonly`);
        return true;
      }
      const hasKey = Object.prototype.hasOwnProperty.call(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (result && hasKey) {
        trigger(target, key, "DELETE");
      }
      return result;
    },
  });
}

const mutableInstrumentations = {
  get: function (key, isShallow = false) {
    const target = this[ORIGIN];
    let result;
    const had = target.has(key);
    if (!had) return;
    track(target, key);
    result = target.get(key);
    if (typeof result === "object" && result !== null && !isShallow) {
      result = reactive(result);
    }
    return result;
  },
  set: function (key, value) {
    const target = this[ORIGIN];
    const had = target.has(key);

    const result = target.set(key, utils.getOrigin(value));
    if (!had) {
      trigger(target, key, "ADD");
    } else {
      const oldValue = target.get(key);
      if (!utils.isSame(oldValue, value)) {
        trigger(target, key, "SET", value);
      }
    }
    return result;
  },
  add: function (key) {
    const target = this[ORIGIN];
    let result;
    if (!target.has(key)) {
      result = target.add(utils.getOrigin(key));
      trigger(target, key, "ADD", value);
    }
    return result;
  },
  delete: function (key) {
    const target = this[ORIGIN];
    let result;
    if (target.has(key)) {
      result = target.delete(key);
      trigger(target, key, "DELETE");
    }
    return result;
  },
  forEach: function (callback, thisArgs) {
    const wrap = (v) => (typeof v === "object" ? reactive(v) : v);
    const target = this[ORIGIN];
    track(target, ITERATE_KEY);
    target.forEach((value, key) => {
      callback.call(this.thisArgs, wrap(value), wrap(key), this);
    });
  },
};

function createNativeDSReactive(o, isShallow = false, isReadonly = false) {
  return new Proxy(o, {
    get(target, key, receiver) {
      // console.info("---get---", key, target, key === ITERATE_KEY, key === ORIGIN);
      if (key === ORIGIN) return target;
      if (key === "size") {
        track(target, ITERATE_KEY);

        // NOTE: 两者似乎并没有区别
        return Reflect.get(target, key, target);
        // return target[key];
      }

      return mutableInstrumentations[key];
    },
  });
}

export function reactive(obj) {
  const existionProxy = reactiveMap.get(obj);
  if (existionProxy) return existionProxy;

  let proxy;
  if (obj instanceof Set || obj instanceof Map) {
    proxy = createNativeDSReactive(obj);
  } else proxy = createReactive(obj);

  reactiveMap.set(obj, proxy);
  return proxy;
}
export function shallowReactive(o) {
  return createReactive(o, true);
}

export function readonly(o) {
  return createReactive(o, false, true);
}

export function shallowReadonly(o) {
  return createReactive(o, true, true);
}

function track(target, key) {
  if (!activeEffect || skipTrack) return target[key];
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);

  // 副作用函数收集自己所访问的 property
  activeEffect.deps.push(deps);
}
function trigger(target, key, type, newVal) {
  // console.info("---", target, key, "---");
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  const keyDeps = depsMap.get(ITERATE_KEY);

  // NOTE: 避免无限循环
  const effectsToRun = new Set(deps);

  if (Array.isArray(target) && key === "length") {
    depsMap.forEach((indexDeps, indexKey) => {
      if (Number(indexKey) >= newVal) {
        indexDeps.forEach((f) => effectsToRun.add(f));
      }
    });
  }

  if (Array.isArray(target) && type === "ADD") {
    const lenghtDeps = depsMap.get("length");
    lenghtDeps?.forEach?.((f) => effectsToRun.add(f));
  }

  if (
    type === "ADD" ||
    type === "DELETE" ||
    (type === "SET" && utils.isMap(target))
  ) {
    keyDeps?.forEach?.((f) => effectsToRun.add(f));
  }
  effectsToRun.forEach((f) => {
    if (f === activeEffect) return;

    if (f.options?.scheduler) f.options.scheduler(f);
    else f();
  });
}
