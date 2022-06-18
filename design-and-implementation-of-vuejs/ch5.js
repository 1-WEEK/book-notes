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

let obj = new Proxy(
  {
    text: 123,
    get bar() {
      return this.text;
    }
  },
  {
    get(target, key, receiver) {
      track(target, key);
      // 避免 getter 访问原对象导致无法正确收集依赖
      return Reflect.get(target, key, receiver);
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
      const type = Object.prototype.hasOwnProperty.call(target, key)
        ? "SET"
        : "ADD";
      console.log(type, key, target.a);
      const result = Reflect.set(target, key, newVal, receiver);
      trigger(target, key, type);
      // > The set() method should return a boolean value.
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set#return_value
      return result;
    },
    deleteProperty(target, key) {
      const hasKey = Object.prototype.hasOwnProperty.call(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (result && hasKey) {
        trigger(target, key, "DELETE");
      }
      return result;
    }
  }
);

function track(target, key) {
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
function trigger(target, key, type) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  const keyDeps = depsMap.get(ITERATE_KEY);
  if (!deps && !keyDeps) return;
  // NOTE: 避免无限循环
  const effectsToRun = new Set(deps);
  if (type === "ADD" || type === "DELETE") {
    keyDeps.forEach((f) => effectsToRun.add(f));
  }
  effectsToRun.forEach((f) => {
    if (f === activeEffect) return;

    if (f.options?.scheduler) f.options.scheduler(f);
    else f();
  });
}

callEffect(() => {
  if ("text" in obj) {
    console.log("111");
  }
});

callEffect(() => {
  console.log(JSON.stringify(obj));
  for (const key in obj) {
    console.log(key);
  }
});

obj.aqweqwe = 888;

delete obj.bar;
