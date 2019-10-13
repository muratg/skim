// LIBRARY: skim-boot-cli
const { emit } = require("./skim-boot-emitter");
const { parse } = require("./skim-boot-parser");
const { make_environment } = require("./skim-boot-environ");
function print(x) {
  process.stdout.write("" + x);
  return process.stdout.write("\n");
}
function compile_string(source) {
  let global_env = make_environment(null);
  let exprs = parse(source);
  let outputs = exprs.map(expr => {
    let output = emit(expr, global_env);
    let formatted = require("prettier").format(output, {
      semi: true,
      parser: "babel"
    });
    return formatted;
  });
  return outputs.join("\n");
}
exports.compile_string = compile_string;
