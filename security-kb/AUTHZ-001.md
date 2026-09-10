# Broken access control and IDOR

Priority: critical
OWASP: A01:2025 Broken Access Control
CWE: CWE-639, CWE-862, CWE-863

## What to look for
Missing authorization check after authentication: any user can access any object by changing :id, ?userId, ?repo, ?docId. Patterns: `findById(req.params.id)` without owner check, `findOne({_id: req.query.id})`, `SELECT ... WHERE id=?` without `AND owner_id=?`, tenant-id taken from client (`req.body.tenantId`, `req.headers.x-tenant`), direct S3/vector-db key from user input, admin flag from client (`req.body.isAdmin`), missing ownership check on PUT/DELETE/PATCH /api/users/:id /api/docs/:id /api/repos/:id.

## Bad examples
```js
app.get("/api/docs/:id", async (req, res) => {
  res.json(await Doc.findById(req.params.id)); // no owner check
});
app.delete("/users/:id", deleteUser); // any logged-in user can delete anyone
```

## How to fix
Check ownership on every object access: `findOne({_id:id, ownerId:req.user.id})`. Deny by default, enforce server-side tenant scoping (never trust client tenant-id). Use middleware like requireOwner(resourceLoader). Test with two accounts swapping IDs. Log and alert on authz denials.
