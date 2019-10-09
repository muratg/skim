// LIBRARY: skim-build
process.stdout.write("" + "hello!");
process.stdout.write("\n");
let files = [
  "./boot/skim-boot-parser.skim",
  "./boot/skim-boot-emitter.skim",
  "./boot/skim-boot-environ.skim",
  "./boot/skim-boot-cli.skim",
  "./boot/skim-example.skim"
];
files.map(f => {
  let ret = require("child_process").execSync(["skim", f].join(" "));
  process.stdout.write("" + ret);
  return process.stdout.write("\n");
});
process.stdout.write("" + "done.");
process.stdout.write("\n");
