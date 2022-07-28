import { reactive } from "./ch5";
import { ref, callEffect, toRef, toRefs, proxyRefs } from "./ch6";
import { isRef } from "./_utils";
import mockConsole from "jest-mock-console";

describe("ch6", () => {
  it("basic", () => {
    const restoreConsole = mockConsole();
    const a = ref(10086);
    expect(isRef(a)).toBeTruthy();
    jest.spyOn(console, "log");
    callEffect(() => {
      console.log(a.value);
    });
    expect(console.log).nthCalledWith(1, 10086);
    a.value = 1024;
    expect(console.log).nthCalledWith(2, 1024);
    restoreConsole();
  });

  it("toRef", () => {
    const restoreConsole = mockConsole();
    const a = reactive({
      foo: 1,
      bar: 2,
    });
    jest.spyOn(console, "log");
    const newA = toRef(a, "foo");
    expect(isRef(newA)).toBeTruthy();
    callEffect(() => {
      console.log(newA.value);
    });
    expect(console.log).nthCalledWith(1, 1);
    newA.value = 123;
    expect(console.log).nthCalledWith(2, 123);
    restoreConsole();
  });

  it("toRefs", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const a = reactive({
      foo: 1,
      bar: 2,
    });
    const newA = toRefs(a);

    callEffect(() => {
      console.log(newA.foo.value, newA.bar.value);
    });
    expect(console.log).nthCalledWith(1, 1, 2);
    newA.bar.value = 123;
    expect(console.log).nthCalledWith(2, 1, 123);

    restoreConsole();
  });

  it("unref", () => {
    const restoreConsole = mockConsole();
    jest.spyOn(console, "log");
    const obj = reactive({
      a: 1,
      b: 2,
    });
    const newObj = proxyRefs({ ...toRefs(obj) });

    callEffect(() => {
      console.log(newObj.a);
    });
    expect(console.log).nthCalledWith(1, 1);
    newObj.b = 123;
    newObj.a = 3;
    expect(console.log).nthCalledWith(2, 3);

    restoreConsole();
  });
});
