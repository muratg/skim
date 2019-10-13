// LIBRARY: skim-compiler-parser
function parse(str) {
  /* ;; NEW parser state */
  function make_parser_state() {
    let parser_state = {};
    parser_state["stream"] = "";
    parser_state["pos"] = 0;
    parser_state["needs-input"] = false;
    return parser_state;
  }
  function stream() {
    return $PS["stream"];
  }
  function stream_setW(v) {
    return ($PS["stream"] = v);
  }
  function pos() {
    return $PS["pos"];
  }
  function pos_setW(v) {
    return ($PS["pos"] = v);
  }
  function needs_input() {
    return $PS["needs-input"];
  }
  function needs_input_setW(v) {
    return ($PS["needs-input"] = v);
  }
  let $PS = make_parser_state();
  function peek() {
    return stream().length === pos() ? "" : stream()[pos()];
  }
  function use() {
    let ret = peek();
    return ret === "" ? ret : (pos_setW(1 + pos()), ret);
  }
  function done_parsing() {
    return peek() === "";
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
  function get_ws() {
    return until(/^(\S|$)/);
  }
  function get_regex() {
    let ret = "";
    let save_pos = pos();
    let done = false;
    use();
    if (!peek() === '"') {
      throw new Error("error: meh");
    }
    use();
    function loop() {
      ret = [ret, until(/^(\\|"|$)/)].join("");
      let next_char = peek();
      if (next_char === "") {
        done = true;
      }
      if (next_char === '"') {
        use();
        done = true;
      }
      if (next_char === "\\") {
        use();
        next_char = peek();
        next_char === '"'
          ? (use(), (ret = [ret, '"'].join("")))
          : ((ret = [ret, "\\"].join("")), (ret = [ret, use()].join("")));
      }
      return done ? new RegExp(ret) : loop();
    }
    return loop();
  }
  function get_string() {
    let ret = "";
    let save_pos = pos();
    let done = false;
    use();
    function loop() {
      ret = [ret, until(/^(\\|"|$)/)].join("");
      let next_char = peek();
      if (next_char === "") {
        pos_setW(save_pos);
        done = true;
      }
      if (next_char === '"') {
        use();
        done = true;
      }
      if (next_char === "\\") {
        use();
        next_char = peek();
        (() => {
          switch (next_char) {
            case '"':
              return use(), (ret = [ret, '\\"'].join(""));
            case "n":
              return use(), (ret = [ret, "\\n"].join(""));
            case "r":
              return use(), (ret = [ret, "\\r"].join(""));
            case "t":
              return use(), (ret = [ret, "\\t"].join(""));
            case "f":
              return use(), (ret = [ret, "\\f"].join(""));
            case "b":
              return use(), (ret = [ret, "\\b"].join(""));
            default:
              return (
                (ret = [ret, "\\"].join("")), (ret = [ret, use()].join(""))
              );
          }
        })();
      }
      return done ? new String(ret) : loop();
    }
    return loop();
  }
  function get_comment() {
    let ret = until(/\n/);
    use();
    return ["comment", ret];
  }
  function get_hashval() {
    let ret = "";
    use();
    (() => {
      switch (use()) {
        case "t":
          return (ret = true);
        case "f":
          return (ret = false);
        case "!":
          return (ret = get_comment());
        case "n":
          return (ret = null);
        default:
          throw new Error(["unknown hashval: ", peek()].join(""));
          return null;
      }
    })();
    return ret;
  }
  function get_atom() {
    let ret = "";
    ret = [ret, until(/^(\s|\\|"|'|`|,|\(|\)|$)/)].join("");
    let flt = parseFloat(ret);
    ret = isNaN(flt) ? ret : flt;
    ret = ret === "" ? null : ret;
    return ret;
  }
  function get_atom2() {
    let ret = "";
    function loop() {
      ret = [ret, until(/^(\s|\\|"|'|`|,|\(|\)|$)/)].join("");
      let next_char = peek();
      return next_char === "\\"
        ? (use(), (ret = [ret, use()].join("")), loop())
        : false;
    }
    return ret;
  }
  function get_expr() {
    "";
    return false;
  }
  function get_quote(quotestyle) {
    use();
    /* ;; get rid of ' */
    let ret = [quotestyle, get_expr()];
    process.stdout.write("" + ret);
    process.stdout.write("\n");
    return ret;
  }
  function get_list() {
    let save_pos = pos();
    use();
    let ret = (() => {
      let expr = get_expr();
      let retv = [];
      while (!(expr == null)) {
        retv = [...retv, ...[expr]];
        expr = get_expr();
        retv = retv;
      }
      return retv;
    })();
    peek() === ")"
      ? use()
      : (pos_setW(save_pos), needs_input_setW(true), (ret = []));
    return ret;
  }
  function get_expr() {
    let ret = "";
    needs_input_setW(false);
    get_ws();
    let next_char = peek();
    (() => {
      switch (next_char) {
        case ";":
          return (ret = get_comment());
        case '"':
          return (ret = get_string());
        case "'":
          return (ret = get_quote("quote"));
        case "`":
          return (ret = get_quote("quasiquote"));
        case "@":
          return (ret = get_regex());
        case "#":
          return (ret = get_hashval());
        case "(":
          return (ret = get_list());
        default:
          return (ret = get_atom());
      }
    })();
    get_ws();
    return ret;
  }
  stream_setW(str);
  /* ;; if we start with #! it means a script (probably) */
  (() => {
    if (peek() === "#") {
      return until(/\n/);
    } else {
      return true;
    }
  })();
  let exprs = [];
  (() => {
    let done = false;
    let expr = get_expr();
    while (!done) {
      exprs = [...exprs, ...[expr]];
      done = done_parsing();
      expr = get_expr();
    }
    return exprs;
  })();
  /* ;; (define expr (get-expr)) */
  /* ;; (define exprs (list expr (list "comment" "HAHA"))) */
  if (needs_input()) {
    throw new Error("more input needed");
  }
  return exprs;
}
exports.parse = parse;
