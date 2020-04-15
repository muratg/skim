#!/usr/bin/env node

/* compiled code */
Object.assign(
  typeof window === "object" ? window : module.exports,
  ((USING = typeof window === "object" ? (_) => window : (lib) => require(lib)) => {
    //----------------------------------------------------------------
    // BEGIN LIBRARY
    ("use strict");
    //----------------------------------------------------------------

    const P = USING("patchable");

    const apply = (fn, xs) => fn(...xs);
    const write = (x) => {
      // console.log("WRITE CALLED", x);
      return x.toString();
    };

    const var$ = P.patchRef;
    const mutated = P.patched;

    //----------------------------------------------------------------
    //----------------------------------------------------------------
    //----------------------------------------------------------------
    //----------------------------------------------------------------

    console.log("Initializing Skim...");
    const OPEN = "(";
    const CLOSE = ")";
    const skim_lexerRules = [
      ["t-comment", /^;[\s\S]*?\n/],
      ["t-string", /^\"([\s\S]*?)\"/],
      ["t-syntax", /^([\(\)\[\)\]\.])/],
      ["t-number", /^(-?[0-9]+[\.]?[0-9]*)/],
      ["t-symbol", /^([a-zA-Z+*/=><_#]?[a-zA-Z0-9+*/=><_#?!]+)/],
      ["t-ws", /^([ \t\n\r]+)/],
    ];
    const skim_makeMatcherFunc = (name, rx) => (src, idx) => {
      if (!(idx < src.length)) {
        throw new Error(["internal error: length(src)", src.length, "should be smaller than idx", idx, "."].join());
      }
      const source = src.slice(idx);
      const matchValue = source.match(rx);
      return matchValue == null
        ? null
        : /*group*/ (() => {
            const newIdx = idx + matchValue[0].length + matchValue["index"];
            return [newIdx, { name: name, value: matchValue[1] }];
          })();
    };
    const skim_tokenMatchers = skim_lexerRules.map((lr) => skim_makeMatcherFunc(lr[0], lr[1]));
    const skim_tokenize = (src) => {
      const [idx, setidx$] = var$(0);
      const [tokens, setTokens$] = var$([]);
      const isHas = () => idx() < src.length;
      const add$ = (t) => setTokens$(tokens().concat(t));
      while (isHas()) {
        const matches = skim_tokenMatchers.map((tm) => tm(src, idx())).filter((m) => !(m == null));
        if (!(matches.length >= 1)) {
          throw new Error(["unknown syntax: ", write(Object.keys(matches)), write(Object.values(matches)), src.slice(idx())].join());
        }
        const m = matches[0];
        const token = m[1];
        const newIdx = m[0];
        setidx$(newIdx);
        add$(token);
      }
      return tokens();
    };
    const skim_mkLambda = (params, body, env) => ({
      etype: "lambda",
      params: params,
      body: body,
      env: env,
    });
    const isSkim_lambda = (e) => (typeof e === "object" ? (e["etype"] === "lambda" ? true : false) : false);
    const skim_mkSymbol = (val) => ({ etype: "symbol", evalue: val });
    const isSkim_symbol = (e) => (typeof e === "object" ? (e["etype"] === "symbol" ? true : false) : false);
    const skim_symbolValue = (e) => e["evalue"];
    const isSkim_number = (x) => typeof x === "number";
    const isSkim_string = (x) => typeof x === "number";
    const isSkim_boolean = (x) => typeof x === "number";
    const isSkim_list = (x) => Array.isArray(x);
    const skim_read = (src) => {
      const tokensAll = skim_tokenize(src);
      const tokens = tokensAll.filter((t) => (t["name"] !== "t-ws" ? (t["name"] !== "t-comment" ? true : false) : false));
      const [idx, setidx$] = var$(0);
      const [exprs, setExprs$] = var$([]);
      const isHasn = (n) => idx() + n < tokens.length;
      const peekn = (n) => {
        if (!isHasn(n)) {
          throw new Error("Not enough tokens.");
        }
        return tokens[idx() + n];
      };
      const use$ = () => setidx$(idx() + 1);
      const add$ = (e) => setExprs$(exprs().concat(e));
      const isHas = () => isHasn(0);
      const pn = () => peekn(0)["name"];
      const pn1 = () => peekn(1)["name"];
      const pv = () => peekn(0)["value"];
      const pv1 = () => peekn(1)["value"];
      const rList = () => {
        const [lst, setlst$, mutlst$] = var$([]);
        if (!(OPEN === pv())) {
          throw new Error("r-list expects first token to be a OPEN character");
        }
        use$();
        while (isHas() ? (pv() !== CLOSE ? true : false) : false) {
          const expr = rBegin();
          mutlst$((x) => x.push(expr));
          lst();
        }
        if (!(CLOSE === pv())) {
          throw new Error(null);
        }
        use$();
        return lst();
      };
      const rSymbol = () => {
        if (!(pn() === "t-symbol")) {
          throw new Error("expected a symbol.");
        }
        const val = pv();
        use$();
        return val === "#t" ? true : val === "#f" ? false : skim_mkSymbol(val);
      };
      const rBegin = () => {
        pn();
        const retval =
          pn() === "t-number"
            ? /*group*/ (() => {
                const ret = pv();
                use$();
                return parseFloat(ret);
              })()
            : pn() === "t-syntax"
            ? pv() === OPEN
              ? rList()
              : pv() === CLOSE
              ? (() => {
                  throw new Error(["unexpected OPEN character"]);
                })()
              : (() => {
                  throw new Error(["unexpected error in r-begin 't-syntax case"]);
                })()
            : pn() === "t-string"
            ? /*group*/ (() => {
                const ret = pv();
                use$();
                return ['"', ret, '"'].join("");
              })()
            : pn() === "t-symbol"
            ? rSymbol()
            : (() => {
                throw new Error(["nope, not ready:", write(pn())]);
              })();
        return retval;
      };
      const bs = src.match(/^[(]/);
      if (!bs) {
        throw new Error("OPEN char expected at the beginning of the file");
      }
      while (isHas()) {
        const expr = rBegin();
        setExprs$(exprs().concat(expr));
      }
      return exprs();
    };
    const skim_expand = (src, toplevel) => src;
    const skim_parse = (src) => {
      const exprs = skim_read(src);
      const expanded = skim_expand(exprs, true);
      return expanded;
    };
    const skim_makeEnv = (parentEnv, values) => {
      const vals = values ? values : {};
      const [G, S$] = var$(vals);
      const isOwningName = (n) => Object.keys(G()).includes(n);
      const getOwn = (n) => {
        if (!isOwningName(n)) {
          throw new Error(["dict doesn't have the key:", Object.keys(n)].join());
        }
        return G()[n];
      };
      const setOwn$ = (n, v) => S$(mutated(G(), (e) => (e[n] = v)));
      const isHas = (n) => (isOwningName(n) ? true : parentEnv ? parentEnv["has?"](n) : false);
      const sget = (n) => (isOwningName(n) ? getOwn(n) : parentEnv ? parentEnv["sget"](n) : getOwn(n));
      const sset$ = (n, v) => (isOwningName(n) ? setOwn$(n, v) : parentEnv ? parentEnv["sset!"](n, v) : setOwn$(n, v));
      return {
        "has?": isHas,
        sget: sget,
        "sset!": sset$,
        "def!": setOwn$,
        _show: () => write(G()),
      };
    };
    const skim_makeToplevelEnv = () => {
      const globals_ = {
        "+": (x, y) => x + y,
        "-": (x, y) => x - y,
        "*": (x, y) => x * y,
        "/": (x, y) => x / y,
        not: (x) => !x,
        "eq?": (x, y) => x === y,
        display: (x) => console.log(x, y),
      };
      return skim_makeEnv(null, globals_);
    };
    const skim_evalFunc = (lambda, argsList) => {
      const parnames = lambda["params"].map((p) => skim_symbolValue(p));
      const parvals = argsList;
      if (!(parnames.length === parvals.length)) {
        throw new Error("Unexpected number of parameters.");
      }
      const body = lambda["body"];
      const capturedEnv = lambda["env"];
      const entr = parnames.map((n, i) => [n, skim_eval(parvals[i], capturedEnv)]);
      const argsDict = Object.fromEntries(entr);
      const funcEnv = skim_makeEnv(capturedEnv, argsDict);
      return skim_eval(body, funcEnv);
    };
    const skim_eval = (expanded, env) => {
      const [isDone, setDone$] = var$(false);
      const IS = (x) => skim_symbolValue(expanded[0]) === x;
      return isSkim_symbol(expanded)
        ? env["sget"](skim_symbolValue(expanded))
        : !Array.isArray(expanded)
        ? expanded
        : IS("begin")
        ? expanded
            .slice(1)
            .map((e) => skim_eval(e, env))
            .slice(-1)[0]
        : IS("quote")
        ? expanded.slice(1)
        : IS("if")
        ? /*group*/ (() => {
            const [_, tst, csq, alt] = expanded;
            const evTst = skim_eval(tst, env);
            return skim_eval(evTst ? csq : alt, env);
          })()
        : IS("define")
        ? /*group*/ (() => {
            const [_, n, v] = expanded;
            const nn = skim_symbolValue(n);
            const vv = skim_eval(v, env);
            return env["def!"](nn, vv);
          })()
        : IS("set!")
        ? /*group*/ (() => {
            const [_, n, v] = expanded;
            const nn = skim_symbolValue(n);
            const vv = skim_eval(v, env);
            return env["sset!"](nn, vv);
          })()
        : IS("lambda")
        ? /*group*/ (() => {
            const [_, params, body] = expanded;
            return skim_mkLambda(params, body, env);
          })()
        : /*group*/ (() => {
            if (!Array.isArray(expanded)) {
              throw new Error(["expected a func call here. perhaps missing a case???", Object.keys(expanded)].join());
            }
            const fnExpr = expanded[0];
            const argsListExpr = expanded.slice(1);
            if (!isSkim_symbol(fnExpr)) {
              throw new Error("fn-expr expected to be a symbol");
            }
            const fnn = skim_symbolValue(fnExpr);
            const fn = skim_eval(fnn, env);
            const fnx = env["sget"](fn);
            const argsList = argsListExpr.map((a) => skim_eval(a, env));
            const ret = isSkim_lambda(fnx) ? skim_evalFunc(fnx, argsList) : apply(fnx, argsList);
            return ret;
          })();
    };
    const skim_makeRepl = (replLog, replPrompt, replSetPrompt, replClose) => {
      const env = skim_makeToplevelEnv();
      const welcome = "Welcome to skim.js. \\h for help, \\q to quit";
      const goodbye = "\nBye bye.\n";
      const helptext = welcome;
      const prompt = "\nskim> ";
      const onStart = (args) =>
        args.length === 1
          ? /*group*/ (() => {
              replLog(welcome);
              replSetPrompt(prompt);
              return replPrompt();
            })()
          : /*group*/ (() => {
              replLog("Command line arguments not supported yet.");
              return replClose();
            })();
      const onClose = () => replLog(goodbye);
      const runLine = (line) => replLog(skim_eval(skim_parse(line), env));
      const onLine = (line) =>
        !(line.match(/\\h/) == null)
          ? /*group*/ (() => {
              replLog(helptext);
              return replPrompt();
            })()
          : !(line.match(/\\q/) == null)
          ? replClose()
          : /*group*/ (() => {
              runLine(line);
              return replPrompt();
            })();
      return [onLine, onStart, onClose];
    };
    const skim_evalStr = (str) => {
      const env = skim_makeToplevelEnv();
      const expr = skim_parse(str);
      const val = skim_eval(expr, env);
      return val;
    };
    const SE = skim_evalStr;
    const SE2 = (str, env) => {
      const expr = skim_parse(str);
      const val = skim_eval(exp, env);
      return val;
    };
    console.log("Skim ready");
    return { skim: { skimEval: skim_evalStr, skimRepl: skim_makeRepl } };
    //----------------------------------------------------------------
    // END LIBRARY
    //----------------------------------------------------------------
  })()
);

if (typeof module === "object") {
  const { skimRepl } = exports["skim"];
  const args = typeof process !== "undefined" ? process.argv.slice(1) : [];
  const makeRL = () => require("readline").createInterface(process.stdin, process.stdout);
  if (args.length >= 1) {
    const rl = makeRL();
    console.log("S");
    let [on_line, on_start, on_close] = skimRepl(
      console.log,
      (x) => rl.prompt(x),
      (x) => rl.setPrompt(x),
      (x) => rl.close(x)
    );
    rl.on("line", on_line);
    rl.on("close", on_close);
    on_start(args);
  } else {
    console.log("Loaded as a library in node.");
  }
}
