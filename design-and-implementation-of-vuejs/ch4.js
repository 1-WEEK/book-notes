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

let obj = new Proxy(
  { text: 123, ok: 10 },
  {
    get(target, key) {
      track(target, key);
      return target[key];
    },
    set(target, key, newVal) {
      target[key] = newVal;
      trigger(target, key);
      // > The set() method should return a boolean value.
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set#return_value
      return true;
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
function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  if (!deps) return;
  // NOTE: 避免无限循环
  const effectsToRun = new Set(deps);
  effectsToRun.forEach((f) => {
    if (f === activeEffect) return;

    if (f.options?.scheduler) f.options.scheduler(f);
    else f();
  });
}

// 存放最后需要调用的 effects
const jobQueue = new Set();

let isFlushing = false;
function flushJob() {
  if (isFlushing) return;

  isFlushing = true;

  Promise.resolve()
    .then((_) => {
      jobQueue.forEach((fn) => fn());
    })
    .finally((_) => (isFlushing = false));
}

function computed(getter) {
  let result;
  let dirty = true;
  const fn = callEffect(getter, {
    lazy: true,
    // 防止 trigger 触发 effect
    scheduler() {
      // 说明依赖值有变化，需要重新计算
      if (!dirty) {
        dirty = true;
        trigger(obj, "value");
      }
    }
  });
  const obj = {
    get value() {
      if (dirty) {
        result = fn();
        dirty = false;
        track(obj, "value");
      }
      return result;
    }
  };
  return obj;
}

function traverse(target, seen = new Set()) {
  if (typeof target !== "object" || target === null || seen.has(target)) {
    return;
  }
  seen.add(target);

  for (const key in target) {
    if (Object.hasOwnProperty.call(target, key)) {
      const element = target[key];
      traverse(element, seen);
    }
  }

  return target;
}

function watch(source, cb, options = {}) {
  let getter;
  if (typeof source === "function") {
    getter = source;
  } else getter = () => traverse(source);

  let newVal;
  let oldVal;
  const job = () => {
    newVal = fn();
    cb(newVal, oldVal);
    oldVal = newVal;
  };
  const fn = callEffect(() => getter(), {
    lazy: true,
    scheduler() {
      if (options.flush === "post") {
        Promise.resolve().then(job);
      } else {
        job();
      }
    }
  });
  if (options.immediate) {
    job();
  } else oldVal = fn();
}

watch(
  () => obj.ok,
  (newVal, oldVal) => {
    console.log("changed", newVal, oldVal);
  },
  {
    immediate: true,
    flush: "post"
  }
);

setTimeout(() => {
  obj.ok++;
  console.log("延迟");
  // obj.ok++;
  // obj.ok++;
  // obj.ok++;
}, 2000);

console.log("正常");

setTimeout(() => {
  obj.ok = 20;
  // obj.text++;
  // obj.text++;
  // obj.text++;
  // obj.text++;
  // obj.text++;
  // obj.text++;
}, 4000);

// callEffect(
//   () => {
//     console.log("render11111");
//     document.body.innerText += obj.ok;
//   },
//   {
//     scheduler: function (fn) {
//       Promise.reject().then(fn);
//     },
//   }
// );
// obj.ok = 123123123
// console.log('1231231231')
