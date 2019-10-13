// LIBRARY: skim-compiler-emitter
const { make_environment } = require("./skim-boot-environ");
/* ;; only exported function */
function emit(expanded, env) {
  /* ;; BUG: these are for forward declaration... will handle these later with compiler bookkeeping */
  function emit_body() {
    return null;
  }
  function emit_identifier() {
    return null;
  }
  function hash_table_ref() {
    return null;
  }
  function print(x) {
    process.stdout.write("" + x);
    return process.stdout.write("\n");
  }
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
    (() => {
      switch (import_style) {
        case "only":
          let vals = import_values.map(v => {
            new_var(env, v, true);
            return emit_identifier(v, env);
          });
          let vals_joined = vals.join(",");
          return (ret = [
            " ",
            ret,
            "const { ",
            vals_joined,
            " } = require('",
            import_name.join("-"),
            "');\n"
          ].join(""));
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
    let ret = ["// LIBRARY: ", name.join("-"), "\n"].join("");
    ret = [" ", ret, emit_toplevel(libbody, env)].join("");
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
  /* ;; quoted. */
  function emit_quote(expanded, env) {
    if (!(expanded.length === 2)) {
      throw new Error("emit-quote requires 2 items");
    }
    let val = expanded.slice(1)[0];
    (() => {
      if (typeof val === "string") {
        return process.stdout.write("" + "YTA");
      } else if (val instanceof String) {
        return process.stdout.write("" + "STRING");
      } else {
        process.stdout.write("" + val);
        return process.stdout.write("" + "!!!!");
      }
    })();
    let new_env = make_environment(env);
    new_var(new_env, val, true);
    return emit_identifier(val, new_env);
  }
  /* ;; ?? */
  function emit_list(expanded, env) {
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
        return emit_quote(expanded, env);
      } else if (expanded[0] === "import") {
        return emit_import(expanded, env);
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
            /* ;; (string-append "" (emit (car expanded) env)) */
            return /* ;; (string-append "" (emit (car expanded) env) "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa" (emit (cdr expanded) env)")") */;
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
  prim("raise", (x, env) =>
    ["", "throw new Error(", emit(x[0], env), ")", ""].join("")
  );
  prim("display", (x, env) =>
    ["", "process.stdout.write('' + ", emit(x[0], env), ")", ""].join("")
  );
  prim("newline", (x, env) => ["", "process.stdout.write('\\n')", ""].join(""));
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
