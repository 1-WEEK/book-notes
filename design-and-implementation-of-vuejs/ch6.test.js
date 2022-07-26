import { ref, callEffect } from "./ch6";
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
});
