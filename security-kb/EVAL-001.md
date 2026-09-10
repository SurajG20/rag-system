# Dangerous eval, dynamic code and insecure deserialization

Priority: high
OWASP: A08:2025 Software and Data Integrity Failures, A05:2025 Injection
CWE: CWE-94, CWE-95, CWE-502

## What to look for
eval(), new Function(), vm.runInNewContext/runInThisContext with user input, setTimeout/setInterval with string, yaml.load without schema/safeLoad, pickle.loads/cPickle, Marshall.load, PHP unserialize, Java ObjectInputStream.readObject, JSON.parse without validation then used in privileged paths, prototype pollution: `obj[req.body.key] = req.body.value`, `_.merge({}, req.body)`, `Object.assign` with __proto__, Handlebars/lodash template compile of user strings.

## Bad examples
```js
eval(req.body.expr);
new Function("return " + userCode)();
yaml.load(userYaml);
_.merge({}, req.body);
```

## How to fix
Remove dynamic execution. Use JSON.parse + schema validation (zod/joi) instead of eval/vm/yaml.load. Use yaml.safeLoad / yaml.load with JSON_SCHEMA. Never pickle/unserialize untrusted payloads. Freeze prototype or use Map, validate keys against allowlist, block __proto__/constructor/prototype.
