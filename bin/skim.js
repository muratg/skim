#!/usr/bin/env node

/* compiled code */

((root) =>
  Object.assign(
    root,
    (() => {
      "use strict";
      const makeRL = () => require("readline").createInterface(process.stdin, process.stdout);
      const P = require("patchable");

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
      const skim_evalStr = (str, env_ = null) => {
        const env = env_ ? env_ : skim_makeToplevelEnv();
        const expr = skim_parse(str);
        const val = skim_eval(expr, env);
        return val;
      };
      const SE = skim_evalStr;

      console.log("Skim ready");

      //----------------------------------------------------------------
      //----------------------------------------------------------------
      //----------------------------------------------------------------
      //----------------------------------------------------------------

      const ret = { skim: { "eval-str": skim_evalStr } };

      //----------------------------------------------------------------

      function make_repl(log, prompt, set_prompt, close) {
        let _env;
        const _repl_welcome = `\n  Skim.js  \\h for help, \\q to quit`;
        const _repl_bye = `\n  Bye.\n`;
        const _repl_help = `
        Skim.js commands:

          \\h  This help
          \\q  Quit Hipfish

        Anything else is evaluated in the current environment.`;

        const _p = "\n  ";

        function on_start(e = null) {
          e == null ? (_env = skim_makeToplevelEnv()) : (_env = e);
          set_prompt(_p);
          log(_repl_welcome);
          prompt();
        }

        function on_close() {
          log(_repl_bye);
        }

        let REPL_FN = skim_evalStr;

        function fancy_out(val) {
          const x = write(val);
          log(x);
        }

        function on_line(line) {
          try {
            let cl = line.trim();
            if (cl.startsWith("\\h")) {
              log(_repl_help);
            } else if (cl.startsWith("\\q")) {
              close();
              return;
            } else {
              let val = REPL_FN(line, _env);
              fancy_out(val);
            }
          } catch (e) {
            log(e);
          }
          prompt();
        }

        /* ;; return 3 values */
        return [on_line, on_start, on_close];
      }

      //----------------------------------------------------------------

      function start_repl(args) {
        let rl = makeRL();
        function rl_prompt(x) {
          rl.prompt(x);
        }
        function rl_set_prompt(x) {
          rl.setPrompt(x);
        }
        function rl_close() {
          rl.close();
        }
        function rl_on(ev, fn) {
          rl.on(ev, fn);
        }
        let [on_line, on_start, on_close] = make_repl(console.log, rl_prompt, rl_set_prompt, rl_close);
        rl_on("line", on_line);
        rl_on("close", on_close);
        return on_start();
      }

      const args = typeof process !== "undefined" ? process.argv.slice(2) : null;
      if (args) {
        if (args.length === 0) {
          start_repl();
        } else if (args.length === 1) {
          throw new Error("Params not supported");
          // const file = "" + fs.readFileSync(args[0]);
          // evaluate(read(file), make_testEnv());
        } else {
          throw new Error("Params not supported");
        }
      }

      return ret;
    })()
  ))(typeof module === "object" && module.exports ? module.exports : typeof window === "object" ? window : this);
