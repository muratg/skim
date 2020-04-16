if (typeof module === "object") {
  const { skimRepl } = module.exports["skim"];
  const args = typeof process !== "undefined" ? process.argv.slice(1) : [];
  const makeRL = () => require("readline").createInterface(process.stdin, process.stdout);
  if (args.length >= 1) {
    const rl = makeRL();
    let [on_line, on_start, on_close] = skimRepl(
      console.log,
      (x) => rl.prompt(x),
      (x) => rl.setPrompt(x),
      (x) => rl.close(x)
    );
    rl.on("line", on_line);
    rl.on("close", on_close);
    on_start(args);
  }
}
