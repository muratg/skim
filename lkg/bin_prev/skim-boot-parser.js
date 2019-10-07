// LIBRARY: skim,compiler,parser
function parse(str) {
  let _stream = "";
  let _pos = 0;
  let _need_input = false;
  function peek() {
    return _stream.length === _pos ? "" : _stream[_pos];
  }
  function use() {
    let ret = peek();
    return ret === "" ? ret : ((_pos = 1 + _pos), ret);
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
    let save_pos = _pos;
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
        _pos = save_pos;
        _need_input = true;
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
    let save_pos = _pos;
    let done = false;
    use();
    function loop() {
      ret = [ret, until(/^(\\|"|$)/)].join("");
      let next_char = peek();
      if (next_char === "") {
        _pos = save_pos;
        _need_input = true;
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
  function get_quoted() {
    throw new Error("NotImplemented");
    return "";
  }
  function get_expr() {
    "";
    return false;
  }
  function get_list() {
    let save_pos = _pos;
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
      : ((_pos = save_pos), (_need_input = true), (ret = []));
    return ret;
  }
  function get_expr() {
    let ret = "";
    _need_input = false;
    get_ws();
    let next_char = peek();
    (() => {
      switch (next_char) {
        case ";":
          return (ret = get_comment());
        case '"':
          return (ret = get_string());
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
  _stream = str;
  (() => {
    if (peek() === "#") {
      return until(/\n/);
    } else {
      return true;
    }
  })();
  let expr = get_expr();
  if (_need_input) {
    throw new Error("more input needed");
  }
  return expr;
}
exports.parse = parse;
