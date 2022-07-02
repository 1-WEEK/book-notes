import { callEffect, reactive } from "./ch5";

describe("ch5", () => {
  it("原对象数据污染", () => {
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
  });
});
