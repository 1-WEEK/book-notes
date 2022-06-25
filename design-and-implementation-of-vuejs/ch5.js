let activeEffect;
const effectStack = [];

function cleanup(effect) {
  effect.deps.forEach((deps) => {
    deps.delete(effect);
  });
  effect.deps.length = 0;
}

function callEffect(fn, options = {}) {
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
const ITERATE_KEY = Symbol();
const ORIGIN = Symbol();

const reactiveMap = new Map();
function reactive(o, isShallow = false, isReadonly = false) {
  return new Proxy(o, {
    get(target, key, receiver) {
      if (key === ORIGIN) {
        return target;
      }

      if (!isReadonly) {
        track(target, key);
      }

      const property = Reflect.get(target, key, receiver);
      if (isShallow) {
        return property;
      }
      if (typeof property === "object" && property !== null) {
        if (!reactiveMap.has(property)) {
          reactiveMap.set(
            property,
            isReadonly ? readonly(property) : reactive(property)
          );
        }
        return reactiveMap.get(property);
      }

      // 避免 getter 访问原对象导致无法正确收集依赖
      return property;
    },
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      track(target, ITERATE_KEY);
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
      const result = Reflect.set(target, key, newVal, receiver);

      if (target === receiver[ORIGIN]) {
        if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
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

function track(target, key) {
  console.log("track", key);
  if (!activeEffect) return target[key];
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
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  const keyDeps = depsMap.get(ITERATE_KEY);

  // NOTE: 避免无限循环
  const effectsToRun = new Set(deps);

  if (Array.isArray(target) && key === "length") {
    console.log(key, newVal)
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

  if (type === "ADD" || type === "DELETE") {
    keyDeps?.forEach?.((f) => effectsToRun.add(f));
  }
  effectsToRun.forEach((f) => {
    if (f === activeEffect) return;

    if (f.options?.scheduler) f.options.scheduler(f);
    else f();
  });
}

const arr = reactive([{ a: 1 }, { b: 90 }, 3, 4, 6]);

callEffect(() => {
  // console.log("长度变了", arr.length);
  console.log('hhhh', arr[4])
});

// arr.push(123);

// arr[5] = 123;
// arr[2] = 9898;

arr.length = 1