let activeEffect;

function callEffect(effect) {
  activeEffect = effect;
  effect();
}

let bucket = new WeakMap();

let obj = new Proxy(
  { text: 123 },
  {
    get: function (target, key) {
      if (!activeEffect) return target[key];
      let depsMap = bucket.get(target);
      if (!depsMap) {
        bucket.set(target, (depsMap = new Map()));
      }
      let deps = depsMap.get(key);
      if (deps) {
        depsMap.set(key, (deps = new Set()));
      }
      deps.add(activeEffect);
      return target[key];
    },
    set: function (target, key, newVal) {
      target[key] = newVal;
      bucket.forEach((f) => f());
      const depsMap = bucket.get(target);
      if (!depsMap) return;
      const deps = depsMap.get(key);
      if (deps) deps.forEach((f) => f());
    },
  }
);

callEffect(() => {
  document.body.innerText = obj.text;
});

setTimeout(() => {
  obj.text = "eqpiruqpoiewu";
}, 2000);
