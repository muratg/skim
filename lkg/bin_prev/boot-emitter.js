exports.emit = function emit(expanded, env) {
  function is_prim(TEMP) {
    "these are for forward declaration... will handle these later with compiler bookkeeping";
    return null;
  }
  function get_emitter(TEMP) {
    null;
  }
  function get_emitter(TEMP) {
    null;
  }
  function emit_body() {
    "TBD";
  }
  function emit_identifier() {
    "TBD";
  }
  function hash_table_ref() {
    "TBD";
  }
  function emit_primcall(expanded, env) {
    let head = expanded[0];
    let args = expanded.slice(1);
    let emitter = get_emitter(head);
    return emitter(args, env);
  }
  function emit_if(expanded, env) {
    expanded.length === 4
      ? true
      : (() => {
          throw new Error("emit-if requires 4 items");
        })();
    let tst = expanded[1];
    let conseq = expanded[2];
    let alt = expanded[3];
    return [
      "",
      emit(tst, env),
      " ? ",
      emit(conseq, env),
      " : ",
      emit(alt, env)
    ].join("");
  }
  function emit_cond(expanded, env) {
    expanded.length < 2
      ? (() => {
          throw new Error("emit-cond requires 2 or more items");
        })()
      : true;
    let clauses = expanded.slice(1);
    let ret = "(()=>{\n";
    clauses.forEach((clause, i) => {
      let pred = clause[0];
      let conseqs = clause.slice(1);
      let tok = i === 0 ? "if" : "else if";
      let cs = conseqs.map(x => emit(x, env));
      cs = cs.map(c => [emit(c, env), ";\n"].join(""));
      cs[cs.length - 1] = ["return ", cs[cs.length - 1]].join("");
      let css = [...cs].join("");
      ret = [
        "  ",
        ret,
        pred === "else" ? pred : [tok, " (", emit(pred, env), ")"].join(""),
        "{",
        css,
        "}\n"
      ].join("");
      return true;
    });
    ret = [ret, "})()"].join("");
    return ret;
  }
  function emit_case(expanded, env) {
    expanded.length < 3
      ? (() => {
          throw new Error("emit-case requires 3 or more items");
        })()
      : true;
    let body = expanded.slice(1);
    let key = body[0];
    let clauses = body.slice(1);
    let ret = ["(() => { switch (", emit(key, env), ") {"].join("");
    clauses.forEach(clause => {
      let vals = clause[0];
      let conseq = clause.slice(1);
      (() => {
        if (vals instanceof Array) {
          return vals.forEach(
            v => (ret = ["   ", ret, "case ", emit(v, env), ":"].join(""))
          );
        } else if (vals === "else") {
          return (ret = ["  ", ret, "default:"].join(""));
        } else {
          return (() => {
            throw new Error("case issues...");
          })();
        }
      })();
      return (ret = ["   ", ret, emit(conseq[0], env), "; break;"].join(""));
    });
    ret = [ret, "}})()"].join("");
    return ret;
  }
  function emit_do(expanded, env) {
    expanded.length >= 3
      ? true
      : (() => {
          throw new Error("do requires 3 or more items");
        })();
    let body = expanded.slice(1);
    let vars = body[0];
    let test_exprs = body.slice(1)[0];
    let cmds = body.slice(1).slice(1);
    let test = test_exprs[0];
    let exprs = test_exprs.slice(1);
    let ret = "(() => {";
    vars.forEach(v => {
      let name = v[0];
      let init = v[1];
      let _step = v[2];
      return (ret = [
        "  ",
        ret,
        "let ",
        emit(name, env),
        " = ",
        emit(init, env),
        ";\n"
      ].join(""));
    });
    ret = ["  ", ret, "while(!(", emit(test, env), ")) {\n"].join("");
    cmds.forEach(c => (ret = ["      ", ret, emit(c, env), ";\n"].join("")));
    vars.forEach(v => {
      let name = v[0];
      let _init = v[1];
      let step = v[2];
      return (ret = [
        "  ",
        ret,
        emit(name, env),
        " = ",
        emit(step, env),
        ";\n"
      ].join(""));
    });
    ret = ["  ", ret, "}\n"].join("");
    let evExprs = exprs.map(x => [emit(x, env), ";\n"].join(""));
    let last = evExprs.length - 1;
    evExprs[last] = ["return ", evExprs[last]].join("");
    let evExprsJoined = [...evExprs].join("");
    ret = [ret, " ", evExprsJoined].join("");
    ret = [ret, "})()"].join("");
    return ret;
  }
  function emit_lambda(expanded, env) {
    expanded.length >= 3
      ? true
      : (() => {
          throw new Error("lambda requires 3 or more items");
        })();
    let body = expanded.slice(1);
    let argnames = body[0];
    let bod = body.slice(1);
    let argsExpr = [argnames.map(x => ["", x].join(""))].join("");
    let bodExpr =
      bod.length === 1
        ? emit(bod[0], env)
        : ["{", emit_body(bod, env), "}"].join("");
    let ret = ["(", argsExpr, ") => ", bodExpr].join("");
    return ret;
  }
  function emit_proccall(expanded, env) {
    let name = emit_identifier(expanded[0], env);
    let args = expanded.slice(1).map(x => [emit(x, env), ""].join(""));
    let ret = ["", name, "(", args, ")"].join("");
    return ret;
  }
  function emit_namedfunction(name, argnames, body, env) {
    let ret = "";
    let args = argnames.map(x => ["", x].join(""));
    let bod = emit_body(body, env);
    let retclause = bod.length === 1 ? "return " : "";
    ret = [
      "function ",
      emit_identifier(name, env),
      "(",
      args,
      ")",
      "{",
      retclause,
      bod,
      "}"
    ].join("");
    return ret;
  }
  function emit_define_library(expanded, env) {
    expanded.length >= 3
      ? true
      : (() => {
          throw new Error("define-library requires 3 or more items");
        })();
    let body = expanded.slice(1);
    let name = body[0];
    let libbody = body.slice(1);
    let exports = libbody[0];
    let clauses = libbody.slice(1);
    let exportshead = exports[0];
    let exportsbody = exports.slice(1);
    exportshead === "export"
      ? "#t"
      : (() => {
          throw new Error("export statement expected here");
        })();
    let ret = ["// LIBRARY: ", name, "\n"].join("");
    clauses.map(
      clause => (ret = [" ", ret, "", emit(clause, env), ";\n"].join(""))
    );
    exportsbody.map(
      ex => (ret = [" ", ret, "exports.", ex, " = ", ex, ";\n"].join(""))
    );
    return ret;
  }
  function emit_apply(expanded, env) {
    expanded.length === 3
      ? true
      : (() => {
          throw new Error("apply requires 3 items");
        })();
    let ret = "";
    let body = expanded.slice(1);
    let fn = body[0];
    let args = body.slice(1);
    let new_expanded = [fn, ["...", args].join("")];
    ret = emit(new_expanded, env);
    return ret;
  }
  function emit_define(expanded, env) {
    expanded.length >= 3
      ? true
      : (() => {
          throw new Error("define requires 3 or more items");
        })();
    let body = expanded.slice(1);
    let name = body[0];
    let exps = body.slice(1);
    let ret = "";
    let new_var = env["newVar"];
    (() => {
      if (name instanceof Array) {
        let actual_name = name[0];
        let args = name.slice(1);
        name = actual_name;
        new_var(name, true);
        return (ret = emit_namedfunction(name, args, exps, env));
      } else {
        new_var(name, true);
        return (ret = [
          "let ",
          emit(name, env),
          " = ",
          emit_body(exps, env),
          ";"
        ].join(""));
      }
    })();
    return ret;
  }
  function emit_body(expanded, env) {
    let exps = expanded.map(x => ["", emit(x, env), ";\n"].join(""));
    let len = exps.length;
    let last = len - 1;
    len > 1 ? (exps[last] = ["return ", exps[last]].join("")) : false;
    let ret = [...exps].join("");
    return ret;
  }
  function emit_begin(expanded, env) {
    let args = expanded.slice(1);
    let exps = args.map(x => emit(x, env));
    let ret = ["(", exps, ")"].join("");
    return ret;
  }
  function emit_set(expanded, env) {
    expanded.length < 3
      ? (() => {
          throw new Error("emit-set requires 3 or more items");
        })()
      : false;
    let name = expanded[1];
    let val = expanded[2];
    let ret = [emit(name, env), " = ", emit(val, env)].join("");
    return ret;
  }
  function emit_list(expanded, env) {
    let getVar = env["getVar"];
    return (() => {
      if (expanded.length === 0) {
        return "[]";
      } else if (is_prim(expanded[0])) {
        return emit_primcall(expanded, env);
      } else if (expanded[0] === "if") {
        return emit_if(expanded, env);
      } else if (expanded[0] === "cond") {
        return emit_cond(expanded, env);
      } else if (expanded[0] === "case") {
        return emit_case(expanded, env);
      } else if (expanded[0] === "do") {
        return emit_do(expanded, env);
      } else if (expanded[0] === "lambda") {
        return emit_lambda(expanded, env);
      } else if (expanded[0] === "define") {
        return emit_define(expanded, env);
      } else if (expanded[0] === "define-library") {
        return emit_define_library(expanded, env);
      } else if (expanded[0] === "begin") {
        return emit_begin(expanded, env);
      } else if (expanded[0] === "set!") {
        return emit_set(expanded, env);
      } else if (expanded[0] === "apply") {
        return emit_apply(expanded, env);
      } else if (expanded[0] === "comment") {
        return "/*MMMM*/";
      } else {
        return getVar(expanded[0])
          ? emit_proccall(expanded, env)
          : [
              "",
              emit(expanded[0], env),
              "(",
              emit(expanded.slice(1), env),
              ")"
            ].join("");
      }
    })();
  }
  function emit_identifier(expanded, env) {
    let ret = "";
    return expanded === "nil"
      ? "null"
      : ((ret = ["", expanded].join("").replace("-", "_")),
        (ret = ret.replace("-", "_")),
        ret);
  }
  function emit_regex(expanded, env) {
    "";
    return expanded;
  }
  function emit_expr(expanded, env) {
    "BUGS (multi line needed)";
    return (() => {
      if (typeof expanded === "number") {
        return ["", expanded].join("");
      } else if (typeof expanded === "boolean") {
        return ["", expanded].join("");
      } else if (expanded instanceof String) {
        return ['"', expanded, '"'].join("");
      } else if (typeof expanded === "string") {
        return emit_identifier(expanded, env);
      } else if (expanded instanceof RegExp) {
        return emit_regex(expanded, env);
      } else if (expanded instanceof Array) {
        return emit_list(expanded, env);
      } else {
        return (() => {
          throw new Error("mm?");
        })();
      }
    })();
  }
  let primitives = {};
  function prim(name, emitter) {
    primitives[name] = emitter;
  }
  function is_prim(name) {
    "";
    return Object.keys(primitives).includes(name);
  }
  function get_emitter(name) {
    "";
    return primitives[name];
  }
  function list_ref() {
    "TBD";
  }
  prim("or", (x, env) =>
    [
      "",
      "(",
      x.map(e => ["", emit(e, env), "||"].join("")),
      " false)",
      ""
    ].join("")
  );
  prim("and", (x, env) =>
    ["", "(", x.map(e => ["", emit(e, env), "&&"].join("")), " true)", ""].join(
      ""
    )
  );
  prim("string-append", (x, env) =>
    ["", "[", x.map(e => [emit(e, env)].join("")), "].join('')", ""].join("")
  );
  prim("list", (x, env) =>
    ["", "[", x.map(e => [emit(e, env)].join("")), "]", ""].join("")
  );
  prim("add1", (x, env) => ["", emit(x[0], env), " + 1 ", ""].join(""));
  prim("sub1", (x, env) => ["", emit(x[0], env), " - 1 ", ""].join(""));
  prim("zero?", (x, env) => ["", emit(x[0], env), " === 0 ", ""].join(""));
  prim("number?", (x, env) =>
    ["", "(typeof ", emit(x[0], env), " === 'number')", ""].join("")
  );
  prim("boolean?", (x, env) =>
    ["", "(typeof ", emit(x[0], env), " === 'boolean')", ""].join("")
  );
  prim("regex?", (x, env) =>
    ["", "(", emit(x[0], env), " instanceof RegExp)", ""].join("")
  );
  prim("nan?", (x, env) => ["", "isNaN(", emit(x[0], env), ")", ""].join(""));
  prim("string->number", (x, env) =>
    ["", "parseFloat(", emit(x[0], env), ")", ""].join("")
  );
  prim("jsnull?", (x, env) => ["", emit(x[0], env), "== null", ""].join(""));
  prim("nil?", (x, env) => ["", emit(x[0], env), "== null", ""].join(""));
  prim("String?", (x, env) =>
    ["", "(", emit(x[0], env), " instanceof String)", ""].join("")
  );
  prim("num+", (x, env) =>
    ["", emit(x[0], env), "+", emit(x[1], env), ""].join("")
  );
  prim("num-", (x, env) =>
    ["", emit(x[0], env), "-", emit(x[1], env), ""].join("")
  );
  prim("num*", (x, env) =>
    ["", emit(x[0], env), "*", emit(x[1], env), ""].join("")
  );
  prim("num/", (x, env) =>
    ["", emit(x[0], env), "/", emit(x[1], env), ""].join("")
  );
  prim("num=", (x, env) =>
    ["", emit(x[0], env), "===", emit(x[1], env), ""].join("")
  );
  prim("num>", (x, env) =>
    ["", emit(x[0], env), ">", emit(x[1], env), ""].join("")
  );
  prim("num<", (x, env) =>
    ["", emit(x[0], env), "<", emit(x[1], env), ""].join("")
  );
  prim("num>=", (x, env) =>
    ["", emit(x[0], env), ">=", emit(x[1], env), ""].join("")
  );
  prim("num<=", (x, env) =>
    ["", emit(x[0], env), "<=", emit(x[1], env), ""].join("")
  );
  prim("not", (x, env) => ["", "!", emit(x[0], env), ""].join(""));
  prim("string?", (x, env) =>
    ["", "(typeof ", emit(x[0], env), " === 'string')", ""].join("")
  );
  prim("string-length", (x, env) =>
    ["", emit(x[0], env), ".length", ""].join("")
  );
  prim("string-ref", (x, env) =>
    ["", emit(x[0], env), "[", emit(x[1], env), "]", ""].join("")
  );
  prim("string=?", (x, env) =>
    ["", emit(x[0], env), " === ", emit(x[1], env), ""].join("")
  );
  prim("string-copy", (x, env) =>
    [
      "",
      emit(x[0], env),
      ".slice(",
      emit(x[1], env),
      ",",
      emit(x[2], env),
      ")",
      ""
    ].join("")
  );
  prim("string-replace", (x, env) =>
    [
      "",
      emit(x[0], env),
      ".replace(",
      emit(x[1], env),
      ",",
      emit(x[2], env),
      ")",
      ""
    ].join("")
  );
  prim("list?", (x, env) =>
    ["", "(", emit(x[0], env), " instanceof Array)", ""].join("")
  );
  prim("null?", (x, env) =>
    ["", emit(x[0], env), ".length === 0 ", ""].join("")
  );
  prim("append", (x, env) =>
    ["", "[...", emit(x[0], env), ", ...", emit(x[1], env), "]", ""].join("")
  );
  prim("length", (x, env) => ["", emit(x[0], env), ".length", ""].join(""));
  prim("list-ref", (x, env) =>
    ["", emit(x[0], env), "[", emit(x[1], env), "]", ""].join("")
  );
  prim("list-set!", (x, env) =>
    [
      "",
      emit(x[0], env),
      "[",
      emit(x[1], env),
      "] = ",
      emit(x[2], env),
      ""
    ].join("")
  );
  prim("car", (x, env) => ["", emit(x[0], env), "[0]", ""].join(""));
  prim("cdr", (x, env) => ["", emit(x[0], env), ".slice(1)", ""].join(""));
  prim("drop", (x, env) =>
    ["", emit(x[0], env), ".slice(", emit(x[1], env), ")", ""].join("")
  );
  prim("for-each", (x, env) =>
    ["", emit(x[1], env), ".forEach(", emit(x[0], env), ")", ""].join("")
  );
  prim("map", (x, env) =>
    ["", emit(x[1], env), ".map(", emit(x[0], env), ")", ""].join("")
  );
  prim("make-hash-table", (x, env) => ["", "{}", ""].join(""));
  prim("hash-table?", (x, env) =>
    ["", "(typeof ", emit(x[0], env), " === 'object')", ""].join("")
  );
  prim("hash-table-ref", (x, env) =>
    ["", emit(x[0], env), "[", emit(x[1], env), "]", ""].join("")
  );
  prim("hash-table-set!", (x, env) =>
    [
      "",
      emit(x[0], env),
      "[",
      emit(x[1], env),
      "] = ",
      emit(x[2], env),
      ""
    ].join("")
  );
  prim("hash-table-exists?", (x, env) =>
    [
      "",
      "Object.keys(",
      emit(x[0], env),
      ").includes(",
      emit(x[1], env),
      ")",
      ""
    ].join("")
  );
  prim("skim-print", (x, env) =>
    ["", "console.log(", emit(x[0], env), ");", ""].join("")
  );
  prim("skim-error", (x, env) =>
    ["", "throw new Error(", emit(x[0], env), ");", ""].join("")
  );
  prim("skim-load", (x, env) =>
    ["", "require('fs').readFileSync(", emit(x[0], env), ", 'utf8')", ""].join(
      ""
    )
  );
  prim("skim-save", (x, env) =>
    [
      "",
      "require('fs').writeFileSync(",
      emit(x[0], env),
      ",",
      emit(x[1], env),
      ")",
      ""
    ].join("")
  );
  prim("regex-test", (x, env) =>
    ["", emit(x[0], env), ".test(", emit(x[1], env), ")", ""].join("")
  );
  prim("make-RegExp", (x, env) =>
    ["", "new RegExp(", emit(x[0], env), ")", ""].join("")
  );
  prim("make-String", (x, env) =>
    ["", "new String(", emit(x[0], env), ")", ""].join("")
  );
  prim("throw-Error", (x, env) =>
    ["", "(()=>{throw new Error(", emit(x[0], env), ");} )()", ""].join("")
  );
  return emit_expr(expanded, env);
}
