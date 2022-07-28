import { callEffect, reactive } from "./ch5";
import { createRenderer } from "./ch7";

describe("renderer", () => {
  it("basic", () => {
    document.body.innerHTML = `
			<div id="root"></div>
		`;
    const foo = reactive({
      bar: "world",
    });
    const { render } = createRenderer();
    callEffect(() => {
      render(`hello ${foo.bar}`, document.querySelector("#root"));
    });
    expect(document.querySelector("#root").innerHTML).toBe("hello world");

    foo.bar = "fucking world";
    expect(document.querySelector("#root").innerHTML).toBe(
      "hello fucking world"
    );
  });
});
