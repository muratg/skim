// LIBRARY: skim,lang,parser
function make_parser_state() {
  let parser_state = {};
  parse_state["stream"] = "";
  parse_state["pos"] = 0;
  parse_state["needs-input"] = false;
  return parser_state;
}
let $PS = make_parser_state();
function stream() {
  return $PS["stream"];
}
function pos() {
  return $PS["pos"];
}
function stream_set_(v) {
  return ($PS["stream"] = v);
}
function pos_set_(v) {
  return ($PS["pos"] = v);
}
function peek() {
  return stream().length === pos() ? "" : stream()[pos()];
}
function use() {
  let ret = peek();
  if (!ret === "") {
    pos_set_(pos() + 1);
  }
  return ret;
}
function until(rx) {
  return (() => {
    let ret = "";
    while (!rx.test(peek())) {
      ret = [ret, use()].join("");
      ret = ret;
    }
    return ret;
  })();
}
function parse(inp) {
  return inp;
}
exports.parse = parse;
