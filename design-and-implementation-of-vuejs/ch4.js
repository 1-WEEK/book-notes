let activeEffect;

function cleanup(effect) {
  effect.deps.forEach(deps=>{
    deps.delete(effect)
  })
  effect.deps.length = 0
}

function callEffect(fn) {
  const effect = () => {
    cleanup(effect)
    activeEffect = effect;
    fn();
  };
  effect.deps = []
  effect();
}

// 防止 target 无法被 GC 回收
let bucket = new WeakMap();

let obj = new Proxy(
  { text: 123, ok: true },
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
      return true
    },
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
  if (!deps) return
  // NOTE: 避免无限循环
  const effectsToRun = new Set(deps)
  effectsToRun.forEach((f) => f());
}

callEffect(() => {
  console.log('render')
  document.body.innerText = obj.ok? obj.text: "it's not ok";
});

setTimeout(() => {
  obj.text = "eqpiruqpoiewu";
}, 2000);

setTimeout(() => {
  obj.ok = false;
}, 3000);

setTimeout(() => {
  obj.text = "123123";
}, 4000);