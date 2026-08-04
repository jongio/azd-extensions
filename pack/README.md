# Extension pack

`jongio.azd` installs the whole extension family in one step:

```bash
azd extension install jongio.azd
```

## Why the pack lives here

A pack has no code. It is a dependency list and nothing else, so it has no
build, no artifacts, and no release of its own to track. Hosting it in the
registry repo keeps it versioned alongside the registry that serves it instead
of attaching it to a library or CLI release it has nothing to do with.

## Files

| File | Role |
|---|---|
| `extension.yaml` | Source of truth. What `azd x pack` and `azd x publish` read. |
| `registry.json` | The registry entry, merged into `public/registry.json` by `scripts/update-registry.js`. |

`registry.json` is checked in rather than generated. The other three extensions
publish theirs from their own repos as part of a release that uploads binaries;
this one has no binaries to upload, so there is no release to hang it off.

## azd defines a pack by absence

There is no `isPack` flag. From azd's own `ExtensionVersion` doc comment:

> An extension with dependencies and no artifacts is considered an extension pack.

`isExtensionPack` in `azd x build` reads the manifest the same way: dependencies
present, and `capabilities`, `namespace`, `language` and `entryPoint` all absent.

The consequence is that adding any one of those four keys to `extension.yaml`
silently turns this back into a regular extension that has no code to run. It
still validates, still publishes, and still installs. It just stops pulling its
dependencies. Nothing reports the change, which is why `scripts/lib/validate.js`
carries `isExtensionPackVersion` and the checks around it rather than a comment
asking people to be careful.

## Versions are floors, not pins

The three extensions release together but not always in lockstep. An exact pin
would force a pack release for every patch to any one of them, so dependencies
declare a minimum and let azd resolve upward.

## Known upstream inconsistency

`registry.schema.json` in Azure/azure-dev lists `namespace` as required for every
extension entry, but a pack manifest must omit `namespace` or it stops being a
pack, and `azd x publish` serializes it with `omitempty`. A published pack entry
therefore has no `namespace` and does not satisfy azd's own registry schema.
This repo does not validate `public/registry.json` against that schema, so it
does not bite here, but it is worth knowing before adding such a check.
