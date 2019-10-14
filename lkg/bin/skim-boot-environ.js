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
