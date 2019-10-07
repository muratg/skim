// LIBRARY: skim,boot,cli
function print(x) {
  process.stdout.write("" + x);
  return process.stdout.write("\n");
}
function compile(source) {
  let global_env = require("./skim-boot-environ").make_environment(null);
  let ast = require("./skim-boot-parser").parse(source);
  let expanded = ast;
  let output = require("./skim-boot-emitter").emit(expanded, global_env);
  let formatted = require("prettier").format(output, {
    semi: true,
    parser: "babel"
  });
  return formatted;
}
function compile_file(name) {
  let source = require("fs").readFileSync(name, "utf8");
  let output = require("./skim-boot-cli").compile(source);
  let new_name = name.replace(".skim", ".js");
  new_name = new_name.replace(".ss", ".js");
  new_name = new_name.replace(".scm", ".js");
  require("fs").writeFileSync(new_name, output);
  return output;
}
let output = "";
function skim_help() {
  let help = "";
  help = [help, "SkimJS", "\n"].join("");
  help = [help, "Help: TBD", "\n"].join("");
  return process.stdout.write("" + help);
}
function start() {
  let args = process.argv.slice(1);
  return 2 === args.length
    ? ((output = require("./skim-boot-cli").compile_file(args[1])),
      eval(`${output}`))
    : skim_help();
}
exports.compile = compile;
exports.compile_file = compile_file;
exports.start = start;
