import mockConsole from "jest-mock-console";
import { callEffect, reactive } from "./ch5";
import * as utils from "./_utils";

describe("ch5", () => {
  it("原对象数据污染", () => {
    const restoreConsole = mockConsole();
    const m = new Map();
    const p1 = reactive(m);
    const p2 = reactive(new Map());
    jest.spyOn(console, "log");

    p1.set("p2", p2);

    callEffect(() => {
      console.log("size:", p1.get("p2").size);
    });
    expect(console.log).nthCalledWith(1, "size:", 0);

    p1.get("p2").set("foo", 1);
    expect(console.log).nthCalledWith(2, "size:", 1);

    m.get("p2").set("foo", 1);
    expect(console.log).toBeCalledTimes(2);
    restoreConsole();
  });

  it("触发 forEach", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const foo = { key: 1 };
    const bar = { value: 1 };
    const v = new Map([[foo, bar]]);

    const p = reactive(v);

    callEffect(() => {
      p.forEach(function (value, key, m) {
        console.log(key, value);
      });
    });
    expect(console.log).nthCalledWith(1, foo, bar);

    const foo1 = { key: 2 };
    const bar1 = { value: 2 };

    p.set(foo1, bar1);
    expect(console.log).nthCalledWith(2, foo, bar);
    expect(console.log).nthCalledWith(3, foo1, bar1);
    restoreConsole();
  });

  it("修改 key 触发 forEach", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const foo = { key: 1 };
    const bar = new Set([1, 2, 3]);
    const v = new Map([[foo, bar]]);

    const p = reactive(v);

    callEffect(() => {
      p.forEach(function (value, key, m) {
        console.log(value.size);
      });
    });
    expect(console.log).nthCalledWith(1, 3);

    p.get(foo).delete(1);
    expect(console.log).nthCalledWith(2, 2);
    restoreConsole();
  });

  it("修改 value 触发 forEach", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const foo = { key: 1 };
    const bar = 1;
    const v = new Map([[foo, bar]]);

    const p = reactive(v);

    callEffect(() => {
      p.forEach(function (value, key, m) {
        console.log(key, value);
      });
    });

    p.set(foo, 2);
    expect(console.log).nthCalledWith(2, foo, 2);
    restoreConsole();
  });

  it("触发迭代器", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const v = new Map([
      ["key1", "value1"],
      ["key2", "value2"],
    ]);

    const p = reactive(v);

    callEffect(() => {
      for (const [key, value] of p) {
        console.log(key, value);
      }
    });
    expect(console.log).nthCalledWith(1, "key1", "value1");
    expect(console.log).nthCalledWith(2, "key2", "value2");
    p.set("key3", "value3");
    expect(console.log).nthCalledWith(5, "key3", "value3");

    restoreConsole();
  });

  it("迭代器传递响应数据", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const v = new Map([
      [{ a: "key1" }, { a: "value1" }],
      [{ a: "key2" }, { a: "value2" }],
    ]);

    const p = reactive(v);

    callEffect(() => {
      for (const [key, value] of p) {
        expect(utils.isReactive(key)).toBe(true);
        expect(utils.isReactive(value)).toBe(true);
        console.log(key, value);
      }
    });

    const a = { a: "key3" };
    const b = { a: "value3" };
    p.set(a, b);
    expect(console.log).nthCalledWith(5, a, b);

    restoreConsole();
  });

  it("entries", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const v = new Map([
      [{ a: "key1" }, { a: "value1" }],
      [{ a: "key2" }, { a: "value2" }],
    ]);

    const p = reactive(v);

    callEffect(() => {
      for (const [key, value] of p.entries()) {
        expect(utils.isReactive(key)).toBe(true);
        expect(utils.isReactive(value)).toBe(true);
        console.log(key, value);
      }
    });

    const a = { a: "key3" };
    const b = { a: "value3" };
    p.set(a, b);
    expect(console.log).nthCalledWith(5, a, b);

    restoreConsole();
  });

  it("values", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const v = new Map([
      [{ a: "key1" }, { a: "value1" }],
      [{ a: "key2" }, { a: "value2" }],
    ]);

    const p = reactive(v);

    callEffect(() => {
      for (const value of p.values()) {
        expect(utils.isReactive(value)).toBe(true);
        console.log(value);
      }
    });

    const a = { a: "key3" };
    const b = { a: "value3" };
    p.set(a, b);
    expect(console.log).nthCalledWith(5, b);

    restoreConsole();
  });

  it("keys", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const a = { a: "key2" };
    const v = new Map([
      [{ a: "key1" }, { a: "value1" }],
      [a, { a: "value2" }],
    ]);
    const p = reactive(v);

    callEffect(() => {
      for (const key of p.keys()) {
        expect(utils.isReactive(key)).toBe(true);
        console.log(key);
      }
    });

    const b = { a: "value3" };
    p.set(a, b);
    expect(console.log).toBeCalledTimes(2);
    p.set({ b: 123 }, b);
    expect(console.log).toBeCalledTimes(5);

    restoreConsole();
  });
});
