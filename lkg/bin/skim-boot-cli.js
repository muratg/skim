const { compile_string } = require("./skim-boot-compiler");

function print(x) {
  process.stdout.write("" + x);
  return process.stdout.write("\n");
}

function compile_file(name, save_output) {
  let source = require("fs").readFileSync(`${name}`, "utf8");
  let output = compile_string(source);
  if (save_output) {
    let new_name = name.replace(".skim", ".js");
    new_name = new_name.replace(".ss", ".js");
    new_name = new_name.replace(".scm", ".js");
    require("fs").writeFileSync(new_name, output);
  }
  return output;
}

let output = "";

function skim_help() {
  let help = "";
  help = [help, "SkimJS", "\n"].join("");
  help = [help, "skim: repl/TBD", "\n"].join("");
  help = [help, "skim filename: run file", "\n"].join("");
  help = [help, "skim -c filename: compile file", "\n"].join("");
  return process.stdout.write("" + help);
}

function start() {
  let args = process.argv.slice(1);
  /* ; (display "*** command-line: " ) (print args) */
  let output = "";
  return (() => {
    if (1 === args.length) {
      return skim_help();
    } else if (2 === args.length) {
      output = compile_file(args[1], false);
      return eval(`${output}`);
    } else if (3 === args.length) {
      return (() => {
        let _1 = args[1];
        let _2 = args[2];

        return _1 === "-c"
          ? (output = compile_file(args[2], true))
          : print(["unknown option: '", _1, "'"].join(""));
      })();
    } else {
      return skim_help();
    }
  })();
}

start();
