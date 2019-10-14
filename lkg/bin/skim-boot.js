/* ; TODO: bug: order can cause infinite loop. try putting env on top. */

// LIBRARY: skim-boot-parser
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

// LIBRARY: skim-boot-environ
function make_environment(parentenv) {
  let env = {};
  let ret = {};
  ret["__parentEnv"] = parentenv;
  ret["__env"] = env;
  ret["newVar"] = (name, val) => (env[name] = val);
  ret["getVar"] = name =>
    (() => {
      if (Object.keys(env).includes(name)) {
        return env[name];
      } else if (parentenv == null) {
        return null;
      } else {
        let getfn = parentenv["getVar"];
        return getfn(name);
      }
    })();
  return ret;
}
exports.make_environment = make_environment;

// LIBRARY: skim-boot-emitter
function print(x) {
  process.stdout.write("" + x);
  return process.stdout.write("\n");
}
/* ;; BUG: these are for forward declaration... will handle these later with compiler bookkeepingV */
function emit() {
  return null;
}
function emit_body() {
  return null;
}
function emit_identifier() {
  return null;
}
function hash_table_ref() {
  return null;
}
let loaded_libs = [];
function register_library(name) {
  /* ;(display (string-append "registering.... " name)) */
  loaded_libs = [...loaded_libs, ...[name]];
  /* ;(print (string-append "... registed.... " loaded-libs)) */
  return false;
}
function library_registered(name) {
  let ret = loaded_libs.includes(name);
  /* ;(print (string-append "############ checking lib: " name ": " ret "...")) */
  /* ;(unless ret (print (string-append "!!!!!!" loaded-libs "????????"))) */
  return ret;
}
function compile_basic(source) {
  let global_env = make_environment(null);
  let exprs = parse(source);
  let outputs = exprs.map(expr => {
    let output = emit(expr, global_env);
    let formatted = require("prettier").format(output, {
      semi: true,
      parser: "babel"
    });
    return formatted;
  });
  return outputs.join("\n");
}
/* ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; */
/* ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; */
function emit(expanded, env) {
  /* ;; scope/tracking */
  function new_var(env, name, val) {
    /* ; (print (string-append "Defining new name " name " as " val "..." )) */
    let fn = env["newVar"];
    return fn(name, val);
  }
  function get_var(env, name) {
    let fn = env["getVar"];
    return fn(name);
  }
  function has_var(env, name) {
    let fn = env["getVar"];
    fn(name);
    return !(fn(name) == null);
  }
  /* ;; primitives */
  /* ;; all implementation at the end of the file */
  let primitives = {};
  function prim(name, emitter) {
    new_var(env, name, true);
    return (primitives[name] = emitter);
  }
  function is_prim(name) {
    return Object.keys(primitives).includes(name);
  }
  function get_emitter(name) {
    return primitives[name];
  }
  /* ;; call a primitive */
  function emit_primcall(expanded, env) {
    let head = expanded[0];
    let args = expanded.slice(1);
    let emitter = get_emitter(head);
    return emitter(args, env);
  }
  /* ;; load a file.. and emit everyhthing in it. */
  /* ;; tracking: what files/modules are loaded (so that we can skip them from "require" if they are already loaded) */
  /* ;; also, don't reload... */
  function emit_load(expanded, env) {
    if (!(2 === expanded.length)) {
      throw new Error("emit-load form requires 2 items");
    }
    let name = expanded[1];
    let src = require("fs").readFileSync(`${name}`, "utf8");
    let output = compile_basic(src);
    return output;
  }
  /* ;; used by cond, case, when, unless */
  /* ;; MMM */
  /* ;; TODO: look into merging emit-body and some other ad-hoc ones here */
  function emit_multiple_exprs(exprs, env, em_return, div_str) {
    let len = exprs.length;
    let last = len - 1;
    let emitted = exprs.map(e => [" ", emit(e, env), div_str, "\n"].join(""));
    if (em_return) {
      emitted[last] = ["return ", emitted[last]].join("");
    }
    let ret = [...emitted].join("");
    /* ;; (print ret) */
    return ret;
  }
  /* ;; let */
  function emit_let(expanded, env) {
    if (expanded.length < 3) {
      throw new Error("emit-let requires 3 or more items");
    }
    let bod = expanded.slice(1);
    let vals = bod[0];
    let exprs = bod.slice(1);
    if (!(vals instanceof Array)) {
      throw new Error("let's first param should be a list");
    }
    let ret = "";
    /* ;; set scope... */
    let new_env = make_environment(env);
    ret = [ret, "(({"].join("");
    /* ;; first pass for the variable names */
    vals.forEach(x => {
      new_var(new_env, x[0], true);
      /* ;; (print (string-append "NEW VAR: " (car x))) */
      return (ret = [ret, " ", emit(x[0], new_env), ", "].join(""));
    });
    let xs = emit_multiple_exprs(exprs, new_env, true, ";");
    ret = [ret, "})=>{ ", xs, "})({"].join("");
    /* ;; second pass for the variable values */
    vals.forEach(x => {
      let name = x[0];
      let args = x.slice(1)[0];
      new_var(new_env, name, true);
      /* ; (print (string-append "::: " name " ---> " args " <---- [[[ " env " **** " new-env " ]]]") ) */
      return (ret = [
        ret,
        " ",
        emit(name, new_env),
        ": ",
        emit(args, new_env),
        ", "
      ].join(""));
    });
    ret = [ret, "})"].join("");
    return ret;
  }
  /* ;; let*  (()=>{ let a = 10; let b = 20; .... body....  })() */
  function emit_let_star(expanded, env) {
    if (expanded.length < 3) {
      throw new Error("emit-let-star requires 3 or more items");
    }
    let bod = expanded.slice(1);
    let vals = bod[0];
    let exprs = bod.slice(1);
    if (!(vals instanceof Array)) {
      throw new Error("let*'s first param should be a list");
    }
    let ret = "";
    /* ;; set scope... */
    let new_env = make_environment(env);
    ret = [ret, "(()=>{"].join("");
    /* ;; first pass for the variable names */
    vals.forEach(x => {
      let name = x[0];
      let args = x.slice(1)[0];
      new_var(new_env, name, true);
      /* ;; (print (string-append "::: " name " ---> " args " <---- [[[ " env " **** " new-env " ]]]") ) */
      return (ret = [
        ret,
        "  let ",
        emit(name, new_env),
        " = ",
        emit(args, new_env),
        ";\n "
      ].join(""));
    });
    ret = [ret, "\n"].join("");
    let xs = emit_multiple_exprs(exprs, new_env, true, ";");
    ret = [ret, "\n", xs, "})()"].join("");
    return ret;
  }
  /* ;; cond works nicely */
  function emit_cond(expanded, env) {
    if (expanded.length < 2) {
      throw new Error("emit-cond requires 2 or more items");
    }
    let clauses = expanded.slice(1);
    let ret = "(()=>{\n";
    clauses.forEach((clause, i) => {
      let pred = clause[0];
      let conseqs = clause.slice(1);
      let tok = i === 0 ? "if" : "else if";
      let css = emit_multiple_exprs(conseqs, env, true, ";");
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
  /* ;; case works nicely */
  function emit_case(expanded, env) {
    if (expanded.length < 3) {
      throw new Error("emit-case requires 3 or more items");
    }
    let body = expanded.slice(1);
    let key = body[0];
    let clauses = body.slice(1);
    let ret = ["(() => { switch (", emit(key, env), ") {"].join("");
    clauses.forEach(clause => {
      let vals = clause[0];
      let conseqs = clause.slice(1);
      (() => {
        if (vals instanceof Array) {
          return vals.forEach(
            v => (ret = ["   ", ret, "case ", emit(v, env), ":"].join(""))
          );
        } else if (vals === "else") {
          return (ret = ["  ", ret, "default:"].join(""));
        } else {
          throw new Error("case issues...");
          return null;
        }
      })();
      return (ret = [
        "   ",
        ret,
        emit_multiple_exprs(conseqs, env, true, ";"),
        " "
      ].join(""));
    });
    ret = [ret, "}})()"].join("");
    return ret;
  }
  /* ;; when's nice */
  function emit_when(expanded, env) {
    if (!(expanded.length >= 3)) {
      throw new Error("emit-when requires 3 or more items");
    }
    let bod = expanded.slice(1);
    let tst = bod[0];
    let conseqs = bod.slice(1);
    let ret = [
      "if (",
      emit(tst, env),
      ") {\n",
      emit_multiple_exprs(conseqs, env, false, ";"),
      "}\n"
    ].join("");
    return ret;
  }
  /* ;; unless's nice */
  function emit_unless(expanded, env) {
    if (!(expanded.length >= 3)) {
      throw new Error("emit-when requires 3 or more items");
    }
    let bod = expanded.slice(1);
    let tst = bod[0];
    let conseqs = bod.slice(1);
    let ret = [
      "if (!",
      emit(tst, env),
      ") {\n",
      emit_multiple_exprs(conseqs, env, false, ";"),
      "}\n"
    ].join("");
    return ret;
  }
  /* ;; if is questionable. ternary operator is nice for expr. but (begin ..) seems problematic. */
  /* ;; TODO: check it out */
  function emit_if(expanded, env) {
    if (!(expanded.length === 4)) {
      throw new Error("emit-if requires 4 items");
    }
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
  /* ;; DO: check if can be improved */
  function emit_do(expanded, env) {
    if (!(expanded.length >= 3)) {
      throw new Error("do requires 3 or more items");
    }
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
  /* ;; lamda is nice */
  function emit_lambda(expanded, env) {
    if (!(expanded.length >= 3)) {
      throw new Error("lambda requires 3 or more items");
    }
    let body = expanded.slice(1);
    let argnames = body[0];
    let bod = body.slice(1);
    /* ;; TODO: make new env, add argnames there.. and run body with that env. */
    let argsExpr = [argnames.map(x => ["", x].join(""))].join("");
    let bodExpr =
      bod.length === 1
        ? emit(bod[0], env)
        : ["{", emit_body(bod, env), "}"].join("");
    let ret = ["(", argsExpr, ") => ", bodExpr].join("");
    return ret;
  }
  /* ;; fine for now */
  function emit_proccall(expanded, env) {
    let name = emit_identifier(expanded[0], env);
    let args = expanded.slice(1).map(x => [emit(x, env), ""].join(""));
    let ret = ["", name, "(", args, ")"].join("");
    return ret;
  }
  /* ;; see if code can be shared */
  function emit_namedfunction(name, argnames, bod, env) {
    let ret = "";
    let argsExpr = [argnames.map(x => ["", x].join(""))].join("");
    let bodExpr =
      bod.length === 1
        ? emit(bod[0], env)
        : ["{", emit_body(bod, env), "}"].join("");
    let retclause =
      bod.length === 1
        ? ["{ return ", bodExpr, "}"].join("")
        : [" ", bodExpr, ""].join("");
    ret = [
      "function ",
      emit_identifier(name, env),
      "(",
      argsExpr,
      ")",
      retclause
    ].join("");
    return ret;
  }
  function emit_import(expanded, env) {
    let ret = "";
    let ex = expanded.slice(1)[0];
    let import_style = ex[0];
    let import_name = ex.slice(1)[0];
    let import_values = ex.slice(1).slice(1);
    let libname = import_name.join("-");
    (() => {
      switch (import_style) {
        case "only":
          let vals = import_values.map(v => {
            new_var(env, v, true);
            return emit_identifier(v, env);
          });
          let vals_joined = vals.join(",");
          if (!library_registered(libname)) {
            ret = [
              " ",
              ret,
              "const { ",
              vals_joined,
              " } = require('./",
              libname,
              "');\n"
            ].join("");
          }
          return true;
        case "prefix":
          throw new Error("prefix not yet supported in include");
          return null;
        default:
          /* ; TODO: BUG: nil shouldn't be required here but oh well */
          throw new Error("only or prefix expected in include statement");
          return null;
      }
    })();
    return ret;
  }
  function emit_toplevel(libbody, env) {
    let ret = "";
    let body_exprs = [];
    /* ;(define import-exprs (list)) */
    let export_exprs = [];
    libbody.map(toplevel => {
      let head = toplevel[0];
      return (() => {
        switch (head) {
          case "export":
            return (export_exprs = [...export_exprs, ...toplevel.slice(1)]);
          default:
            return (body_exprs = [...body_exprs, ...[toplevel]]);
        }
      })();
    });
    body_exprs.map(
      clause => (ret = [" ", ret, "", emit(clause, env), ";\n"].join(""))
    );
    export_exprs.map(
      ex =>
        (ret = [
          " ",
          ret,
          "exports.",
          emit(ex, env),
          " = ",
          emit(ex, env),
          ";\n"
        ].join(""))
    );
    return ret;
  }
  function emit_define_library(expanded, env) {
    if (!(expanded.length >= 2)) {
      throw new Error("define-library requires 2 or more items");
    }
    let body = expanded.slice(1);
    let name = body[0];
    /* ;; TODO: make an "emit-toplevel" and send it libbody from here as well as elsewhere in the future. */
    let libbody = body.slice(1);
    let libname = name.join("-");
    let ret = "";
    if (!library_registered(name)) {
      /* ;(display "registered library: ") */
      /* ;(print name) */
      register_library(libname);
      ret = ["// LIBRARY: ", libname, "\n"].join("");
      ret = [" ", ret, emit_toplevel(libbody, env)].join("");
    }
    /* ;(when (library-registered name) */
    /* ;(display "library alresady registered! ") */
    /* ;(display name) */
    /* ;(newline)) */
    return ret;
  }
  /* ;; apply */
  function emit_apply(expanded, env) {
    if (!(expanded.length === 3)) {
      throw new Error("apply requires 3 items");
    }
    let ret = "";
    let body = expanded.slice(1);
    let fn = body[0];
    let args = body.slice(1);
    let new_expanded = [fn, ["...", args].join("")];
    ret = emit(new_expanded, env);
    return ret;
  }
  /* ;; define */
  function emit_define(expanded, env) {
    if (!(expanded.length >= 3)) {
      throw new Error("define requires 3 or more items");
    }
    let body = expanded.slice(1);
    let name = body[0];
    let exps = body.slice(1);
    let ret = "";
    (() => {
      if (name instanceof Array) {
        let actual_name = name[0];
        let args = name.slice(1);
        name = actual_name;
        new_var(env, name, true);
        return (ret = emit_namedfunction(name, args, exps, env));
      } else {
        new_var(env, name, true);
        return (ret = [
          "let ",
          emit(name, env),
          " = ",
          emit_body(exps, env),
          ""
        ].join(""));
      }
    })();
    return ret;
  }
  /* ;; body... sharing code? */
  function emit_body(expanded, env) {
    let exps = expanded.map(x => ["", emit(x, env), ";\n"].join(""));
    let len = exps.length;
    let last = len - 1;
    if (len > 1) {
      exps[last] = ["return ", exps[last]].join("");
    }
    let ret = [...exps].join("");
    return ret;
  }
  /* ;; This is for "expression" form of begin.. */
  /* ;; "statement" form will be "expanded" */
  function emit_begin_expression(expanded, env) {
    let args = expanded.slice(1);
    let exps = args.map(x => emit(x, env));
    let ret = ["(", exps, ")"].join("");
    return ret;
  }
  /* ;; should have options.. inside begin, this may have issues.. */
  function emit_set(expanded, env) {
    if (expanded.length < 3) {
      throw new Error("emit-set requires 3 or more items");
    }
    let name = expanded[1];
    let val = expanded[2];
    let ret = [emit(name, env), " = ", emit(val, env)].join("");
    return ret;
  }
  /* ;; quote, quasiquote */
  function emit_quotes(expanded, env) {
    if (!(expanded.length === 2)) {
      process.stdout.write("" + "emit-quote:");
      process.stdout.write("" + expanded);
      process.stdout.write("\n");
      throw new Error("emit-quote requires 2 items");
    }
    let quote_style = expanded[0];
    let qq = quote_style === "quasiquote" ? true : false;
    let val = expanded.slice(1)[0];
    let ret = "";
    (() => {
      if (typeof val === "string") {
        /* ; (display "id") (display val) (newline) */
        let new_env = make_environment(env);
        new_var(new_env, val, true);
        /* ;; (set! set  (string-append " "  ret " " (emit-identifier val new-env)))) */
        return (ret = [
          " ",
          ret,
          " Symbol.for('",
          emit_identifier(val, new_env),
          "').toString()"
        ].join(""));
      } else if (val instanceof Array) {
        /* ; (display "list") */
        /* ;;(define lst (list)) */
        ret = [" ", ret, "[ "].join("");
        val.map(
          v =>
            (ret = [" ", ret, " ", emit([...["quote"], ...[v]], env), ","].join(
              ""
            ))
        );
        return (ret = [" ", ret, " ]"].join(""));
      } else {
        /* ; (display val) (display "!!!!") */
        return (ret = [" ", ret, "", emit(val, env)].join(""));
      }
    })();
    /* ; (display "RET") (display ret) (display ";") (newline) */
    return ret;
  }
  function emit_test_group(expanded, env) {
    if (!(expanded.length >= 3)) {
      throw new Error(
        "test-group requires 3+ values: test-group, name, ...body"
      );
    }
    let ret = "";
    let bod = expanded.slice(1);
    let name = bod[0];
    let exprs = bod.slice(1);
    ret = [ret, "test(", emit(name, env), ",()=>{ "].join("");
    exprs.map(e => (ret = [ret, " ", emit(e, env)].join("")));
    ret = [ret, " });  "].join("");
    return ret;
  }
  function emit_test(expanded, env) {
    if (!(expanded.length === 3)) {
      throw new Error("test requires 3 values: test, expected, expr ");
    }
    let expected = expanded[1];
    let expr = expanded[2];
    let ret = [
      "expect(",
      emit(expr, env),
      ").toEqual(",
      emit(expected, env),
      ");\n"
    ].join("");
    return ret;
  }
  /* ;; ?? */
  function emit_list(expanded, env) {
    /* ; (display expanded) (display "------------") (newline) */
    return (() => {
      if (expanded.length === 0) {
        return "[]";
      } else if (is_prim(expanded[0])) {
        return emit_primcall(expanded, env);
      } else if (expanded[0] === "let") {
        return emit_let(expanded, env);
      } else if (expanded[0] === "let*") {
        return emit_let_star(expanded, env);
      } else if (expanded[0] === "if") {
        return emit_if(expanded, env);
      } else if (expanded[0] === "when") {
        return emit_when(expanded, env);
      } else if (expanded[0] === "unless") {
        return emit_unless(expanded, env);
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
        return emit_begin_expression(expanded, env);
      } else if (expanded[0] === "set!") {
        return emit_set(expanded, env);
      } else if (expanded[0] === "apply") {
        return emit_apply(expanded, env);
      } else if (expanded[0] === "quote") {
        return emit_quotes(expanded, env);
      } else if (expanded[0] === "quasiquote") {
        return emit_quotes(expanded, env);
      } else if (expanded[0] === "import") {
        return emit_import(expanded, env);
      } else if (expanded[0] === "test-group") {
        return emit_test_group(expanded, env);
      } else if (expanded[0] === "test") {
        return emit_test(expanded, env);
      } else if (expanded[0] === "load") {
        return emit_load(expanded, env);
      } else if (expanded[0] === "comment") {
        return ["/* ", expanded.slice(1), " */\n"].join("");
      } else {
        let name = expanded[0];
        let val = get_var(env, name);
        return (() => {
          if (val) {
            /* ; (print (string-append "proc call --> " name " ... " val)) */
            return emit_proccall(expanded, env);
          } else {
            /* ; (print (string-append "NOT proc call --> " name " ... " val " ...___ " expanded)) */
            /* ;; TODO: this should work: */
            ["", name, ""].join("");
            return /* ;; (string-append "" (emit (car expanded) env)) */;
          }
        })();
      }
    })();
  }
  /* ;; TODO; check identifier better */
  function emit_identifier(expanded, env) {
    let ret = "";
    return expanded === "nil"
      ? "null"
      : ((ret = ["", expanded].join("").replace("-", "_")),
        (ret = ret.replace("-", "_")),
        (ret = ret.replace("?", "P")),
        (ret = ret.replace("!", "W")),
        ret);
  }
  function emit_regex(expanded, env) {
    return expanded;
  }
  function emit_expr(expanded, env) {
    /* ;(print (string-append "REGEX????????????????????? "  expanded "???")) */
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
        throw new Error(["mm?", expanded].join(""));
        return null;
      }
    })();
  }
  /* ;; cleanup opportunities here */
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
  prim("add1", (x, env) => ["", emit(x[0], env), " + 1 ", ""].join(""));
  prim("sub1", (x, env) => ["", emit(x[0], env), " - 1 ", ""].join(""));
  prim("zero?", (x, env) => ["", emit(x[0], env), " === 0 ", ""].join(""));
  prim("number?", (x, env) =>
    ["", "(typeof ", emit(x[0], env), " === 'number')", ""].join("")
  );
  prim("boolean?", (x, env) =>
    ["", "(typeof ", emit(x[0], env), " === 'boolean')", ""].join("")
  );
  prim("procedure?", (x, env) =>
    ["", "(typeof ", emit(x[0], env), " === 'function)", ""].join("")
  );
  prim("regex?", (x, env) =>
    ["", "(", emit(x[0], env), " instanceof RegExp)", ""].join("")
  );
  prim("nan?", (x, env) => ["", "isNaN(", emit(x[0], env), ")", ""].join(""));
  prim("string->number", (x, env) =>
    ["", "parseFloat(", emit(x[0], env), ")", ""].join("")
  );
  prim("String?", (x, env) =>
    ["", "(", emit(x[0], env), " instanceof String)", ""].join("")
  );
  prim("+", (x, env) =>
    ["(", emit(x[0], env), "+", emit(x[1], env), ")"].join("")
  );
  prim("-", (x, env) =>
    ["(", emit(x[0], env), "-", emit(x[1], env), ")"].join("")
  );
  prim("*", (x, env) =>
    ["(", emit(x[0], env), "*", emit(x[1], env), ")"].join("")
  );
  prim("/", (x, env) =>
    ["(", emit(x[0], env), "/", emit(x[1], env), ")"].join("")
  );
  prim("=", (x, env) =>
    ["(", emit(x[0], env), "===", emit(x[1], env), ")"].join("")
  );
  prim(">", (x, env) =>
    ["(", emit(x[0], env), ">", emit(x[1], env), ")"].join("")
  );
  prim("<", (x, env) =>
    ["(", emit(x[0], env), "<", emit(x[1], env), ")"].join("")
  );
  prim(">=", (x, env) =>
    ["(", emit(x[0], env), ">=", emit(x[1], env), ")"].join("")
  );
  prim("<=", (x, env) =>
    ["(", emit(x[0], env), "<=", emit(x[1], env), ")"].join("")
  );
  prim("not", (x, env) => ["", "!(", emit(x[0], env), ")"].join(""));
  prim("string-append", (x, env) =>
    ["", "[", x.map(e => [emit(e, env)].join("")), "].join('')", ""].join("")
  );
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
  /* ;; srfi 130 */
  /* ;; (prim "string-join" (lambda (x env) (string-append "" "["  (map (lambda (e) (string-append (emit e env)))  (car x)) "].join('" (emit (car (cdr x)) env) " ')"   ""  ))) */
  prim("string-join", (x, env) =>
    ["", emit(x[0], env), ".join(", emit(x.slice(1)[0], env), " )", ""].join("")
  );
  prim("list", (x, env) =>
    ["", "[", x.map(e => [emit(e, env)].join("")), "]", ""].join("")
  );
  prim("list?", (x, env) =>
    ["", "(", emit(x[0], env), " instanceof Array)", ""].join("")
  );
  prim("null?", (x, env) =>
    ["", emit(x[0], env), ".length === 0 ", ""].join("")
  );
  prim("list-includes?", (x, env) =>
    ["", emit(x[0], env), ".includes(", emit(x[1], env), ")"].join("")
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
  prim("raise", (x, env) =>
    ["", "throw new Error(", emit(x[0], env), ")", ""].join("")
  );
  prim("display", (x, env) =>
    ["", "process.stdout.write('' + ", emit(x[0], env), ");\n", ""].join("")
  );
  prim("newline", (x, env) =>
    ["", "process.stdout.write('\\n');\n", ""].join("")
  );
  /* ;; checks for JavaScript null and undefined (via "==") */
  prim("nil?", (x, env) => ["", emit(x[0], env), "== null", ""].join(""));
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
  prim("regex-test", (x, env) =>
    ["", emit(x[0], env), ".test(", emit(x[1], env), ")", ""].join("")
  );
  prim("make-RegExp", (x, env) =>
    ["", "new RegExp(", emit(x[0], env), ")", ""].join("")
  );
  prim("make-String", (x, env) =>
    ["", "new String(", emit(x[0], env), ")", ""].join("")
  );
  /* ;; file io */
  prim("skim-load", (x, env) =>
    [
      "",
      "require('fs').readFileSync(`${",
      emit(x[0], env),
      "}`, 'utf8')",
      ""
    ].join("")
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
  prim("skim-exec", (x, env) =>
    ["", "require('child_process').execSync(", emit(x[0], env), ")", ""].join(
      ""
    )
  );
  /* ; (prim "skim-make-environment" (lambda (x env) (string-append "" "require('./skim-boot-environ').make_environment(" (emit (list-ref x 0) env) ")" "" ))) */
  /* ; (prim "skim-parse" (lambda (x env) (string-append "" "require('./skim-boot-parser').parse(" (emit (list-ref x 0) env) ")" "" ))) */
  /* ; (prim "skim-emit" (lambda (x env) (string-append "" "require('./skim-boot-emitter').emit(" (emit (list-ref x 0) env) "," (emit (list-ref x 1) env) ")" "" ))) */
  /* ; (prim "skim-compile" (lambda (x env) (string-append "" "require('./skim-boot-cli').compile(" (emit (list-ref x 0) env) ")" "" ))) */
  /* ; (prim "skim-compile-file" (lambda (x env) (string-append "" "require('./skim-boot-cli').compile_file(" (emit (list-ref x 0) env) ")" "" ))) */
  prim("skim-prettier", (x, env) =>
    [
      "",
      "require('prettier').format(",
      emit(x[0], env),
      ", { semi: true, parser: 'babel' } )",
      ""
    ].join("")
  );
  /* ; (prim "skim-js-eval" (lambda (x env) (string-append "" "eval(`" (emit (list-ref x 0) env) "`)" "" ))) */
  prim("skim-js-eval", (x, env) => ["", "eval(`${", x, "}`)", ""].join(""));
  prim("command-line", (x, env) => "process.argv.slice(1)");
  return emit_expr(expanded, env);
}
exports.emit = emit;
exports.compile_basic = compile_basic;


function print(x) {
  process.stdout.write("" + x);
  return process.stdout.write("\n");
}

function compile_file(name, save_output) {
  let source = require("fs").readFileSync(`${name}`, "utf8");
  let output = compile_basic(source);
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
