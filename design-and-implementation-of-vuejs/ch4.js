let bucket = new Set();

function Effect() {
  document.body.innerText = obj.text;
};

let obj = new Proxy(
  { text: 123 },
  {
    get: function (target, key) {
      if (Effect) {
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

Effect()

setTimeout(() => {
  obj.text = "eqpiruqpoiewu";
}, 2000);
