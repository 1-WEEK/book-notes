import { callEffect, reactive } from "./ch5";
import { createRenderer, Vnode } from "./ch7";

describe("renderer", () => {
  it("mount", () => {
    document.body.innerHTML = `
			<div id="root"></div>
		`;
    const foo = reactive({
      bar: "world",
    });
    const { render } = createRenderer();
    callEffect(() => {
      render(
        new Vnode("h1", `hello ${foo.bar}`),
        document.querySelector("#root")
      );
    });
    expect(document.querySelector("#root h1").innerHTML).toBe("hello world");
  });

	it("patch", () => {
    document.body.innerHTML = `
			<div id="root"></div>
		`;
    const foo = reactive({
      bar: "world",
    });
    const { render } = createRenderer();
    callEffect(() => {
      render(
        new Vnode("h1", `hello ${foo.bar}`),
        document.querySelector("#root")
      );
    });

    foo.bar = "fucking world";

    expect(document.querySelector("#root h1").innerHTML).toBe(
      "hello fucking world"
    );
  });
});
