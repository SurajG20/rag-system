# Path traversal and unsafe file access

Priority: high
OWASP: A01:2025 Broken Access Control
CWE: CWE-22, CWE-73

## What to look for
fs.readFile, fs.writeFile, fs.createReadStream, res.sendFile, res.download using user-supplied paths without resolving inside an allowlisted directory: `path.join(base, req.query.file)`, `readFile("./uploads/" + req.body.name)`, unchecked ../, ..%2f, absolute paths /etc/passwd, null bytes, symlink follows, zip-slip (tar/zip extract without prefix check), file upload with original filename used directly.

## Bad examples
```js
fs.readFile(path.join(__dirname, "files", req.query.name));
res.sendFile(req.body.path);
fs.writeFile("uploads/" + req.file.originalname, data);
```

## How to fix
Resolve the path then ensure it stays under a base directory: `resolved = path.resolve(base, input); if (!resolved.startsWith(base + path.sep)) reject`. Allowlist names (basename, UUID, alphanumeric + limited ext). Store uploads outside webroot with random names. Reject absolute paths and .. segments.
