---
name: conventional-commit
description: Se usa para el mensaje de un commit, usando Conventional Commit.
---

# Conventional Commit

Cuando generes un mensaje de commit:

1. Mirá el `git diff --staged` para entender qué cambió.
2. Elegí el tipo: 'feature', 'fix', 'docs', 'refactor', 'test', 'chore'.
3. Formato: `tipo(scope): descripcion`, en ingles, minuscula, máximo 50 caracteres.

Ejemplo: feature(auth): add next-auth configuration
