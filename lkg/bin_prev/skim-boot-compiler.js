// LIBRARY: skim-boot-compiler
const { emit, compile_basic } = require("./skim-boot-emitter");
const { parse } = require("./skim-boot-parser");
const { make_environment } = require("./skim-boot-environ");
function print(x) {
  process.stdout.write("" + x);
  return process.stdout.write("\n");
}
function compile_string(source) {
  let global_env = make_environment(null);
  let result = compile_basic(source);
  return result;
}
exports.compile_string = compile_string;
