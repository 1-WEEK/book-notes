let activeEffect;

function callEffect(effect) {
  activeEffect = effect;
  effect();
}

let bucket = new Set();

let obj = new Proxy(
  { text: 123 },
  {
    get: function (target, key) {
      if (activeEffect) {
        bucket.add(activeEffect);
      }
      return target[key];
    },
    set: function (target, key, newVal) {
      target[key] = newVal;
      bucket.forEach((f) => f());
      return true;
    },
  }
);

callEffect(() => {
  document.body.innerText = obj.text;
});

setTimeout(() => {
  obj.text = "eqpiruqpoiewu";
}, 2000);
