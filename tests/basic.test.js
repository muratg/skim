const { compile_basic } = require("./../bin/skim");

let compile_string = compile_basic;

test("my basic tests", () => {
  expect(2 * 5).toEqual(10);
  let x = 10;
  expect(x).toEqual(10);
});

test("compile basic expressions", () => {
  let res = compile_string("(* 1 2)");
  process.stdout.write("" + res);
  expect(res).toEqual("1 * 2;\n");
  expect(compile_string("(/ 10.2 -3)")).toEqual("10.2 / -3;\n");
  expect(compile_string("(* 111 (- 2 20))")).toEqual("111 * (2 - 20);\n");
});

test("quote", () => {
  expect(1).toEqual(1);
  expect(Symbol.for("a").toString()).toEqual("Symbol(a)");
});

test("compile quote", () => {
  expect(compile_string("(quote 1)")).toEqual("1;\n");
  expect(compile_string('(quote "x")')).toEqual('"x";\n');
  expect(compile_string('(quasiquote "x")')).toEqual('"x";\n');
});
