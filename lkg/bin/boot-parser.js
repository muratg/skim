exports.parse = function parse(str) {
  let _stream = "";
  let _pos = 0;
  let _need_input = false;
  function peek() {
    "";
    return _stream.length === _pos ? "" : _stream[_pos];
  }
  function use() {
    let ret = peek();
    return ret === "" ? ret : ((_pos = 1 + _pos), ret);
  }
  function until(rx) {
    "...";
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
    "";
    return until(/^(\S|$)/);
  }
  function get_regex() {
    let ret = "";
    let save_pos = _pos;
    let done = false;
    use();
    peek() === '"'
      ? true
      : (() => {
          throw new Error("error: meh");
        })();
    use();
    function loop() {
      ret = [ret, until(/^(\\|"|$)/)].join("");
      let next_char = peek();
      next_char === ""
        ? ((_pos = save_pos), (_need_input = true), (done = true))
        : false;
      next_char === '"' ? (use(), (done = true)) : false;
      next_char === "\\"
        ? (use(),
          (next_char = peek()),
          next_char === '"'
            ? (use(), (ret = [ret, '"'].join("")))
            : ((ret = [ret, "\\"].join("")), (ret = [ret, use()].join(""))))
        : false;
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
      next_char === ""
        ? ((_pos = save_pos), (_need_input = true), (done = true))
        : false;
      next_char === '"' ? (use(), (done = true)) : false;
      next_char === "\\"
        ? (use(),
          (next_char = peek()),
          (() => {
            switch (next_char) {
              case '"':
                use(), (ret = [ret, '\\"'].join(""));
                break;
              case "n":
                use(), (ret = [ret, "\\n"].join(""));
                break;
              case "r":
                use(), (ret = [ret, "\\r"].join(""));
                break;
              case "t":
                use(), (ret = [ret, "\\t"].join(""));
                break;
              case "f":
                use(), (ret = [ret, "\\f"].join(""));
                break;
              case "b":
                use(), (ret = [ret, "\\b"].join(""));
                break;
              default:
                (ret = [ret, "\\"].join("")), (ret = [ret, use()].join(""));
                break;
            }
          })())
        : false;
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
          ret = true;
          break;
        case "f":
          ret = false;
          break;
        case "n":
          ret = null;
          break;
        default:
          (() => {
            throw new Error(["unknown hashval: ", peek()].join(""));
          })();
          break;
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
    "";
    return (() => {
      throw new Error("NotImplemented");
    })();
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
          ret = get_comment();
          break;
        case '"':
          ret = get_string();
          break;
        case "@":
          ret = get_regex();
          break;
        case "#":
          ret = get_hashval();
          break;
        case "(":
          ret = get_list();
          break;
        default:
          ret = get_atom();
          break;
      }
    })();
    get_ws();
    return ret;
  }
  _stream = str;
  let expr = get_expr();
  _need_input
    ? (() => {
        throw new Error("more input needed");
      })()
    : false;
  return expr;
}
