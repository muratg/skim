// LIBRARY: skim,compiler,env
function make_environment(parentenv) {
  let env = {};
  let ret = {};
  ret["newVar"] = (name, val) => (env[name] = val);
  ret["getVar"] = name =>
    (() => {
      if (Object.keys(env).includes(name)) {
        return env[name];
      } else if (parentenv == null) {
        return null;
      } else {
        return parentenv["getVar"](name([]));
      }
    })();
  return ret;
}
exports.make_environment = make_environment;
