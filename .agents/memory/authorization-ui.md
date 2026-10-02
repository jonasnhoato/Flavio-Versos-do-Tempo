---
name: Permissões ao trocar de conta
description: Por que limpar o cache não basta para retirar ferramentas editoriais após sair.
---
As permissões visuais devem acompanhar imediatamente a identidade e o estado de login, sem depender apenas da limpeza do cache.

**Why:** Foi observado que os componentes ainda exibiam os resultados anteriores depois de limpar o cache ao sair: o cabeçalho já mostrava visitante, mas as ferramentas do autor permaneciam visíveis. O servidor bloqueava as alterações, mas a interface era enganosa.

**How to apply:** Isolar resultados de autorização por identidade e exigir uma sessão ativa antes de exibir ações editoriais. Manter a verificação independente no servidor; ocultar botões nunca substitui autorização.