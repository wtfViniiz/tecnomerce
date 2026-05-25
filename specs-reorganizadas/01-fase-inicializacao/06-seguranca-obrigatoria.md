# Fase 1 - Seguranca Obrigatoria

## Regra
As regras deste arquivo sao obrigatorias para toda implementacao. A LLM nao deve afrouxar, omitir ou transferir essas responsabilidades para o client.

## Validacao
- Toda validacao de seguranca deve acontecer no backend.
- O client pode executar validacao de UX, mas essa validacao nao possui valor de seguranca.
- O backend deve validar `body`, `params`, `query`, `headers`, autenticacao, autorizacao e ownership.
- O backend nao deve confiar em preco, frete, desconto, role, permission, status de pagamento, status de pedido ou qualquer valor calculado no client.

## Tokens, hashes e segredos
- O frontend nao deve receber refresh token em JSON.
- O frontend nao deve receber hash de senha, hash de refresh token, hash de backup code ou segredo criptografico.
- A API nao deve expor token interno, token de provider, secret, hash, cookie bruto ou chave privada em resposta.
- Logs nao devem conter senha, token, hash, cookie, cabecalho `Authorization`, session secret, payload de cartao ou credencial de terceiro.
- O codigo nao deve hardcodar segredo, chave, token, senha ou credencial.

## Auth e sessao
- Refresh token deve existir apenas em cookie `HttpOnly Secure SameSite=Strict`.
- Access token deve ter vida curta e nao deve ser salvo em storage persistente inseguro.
- Toda sessao deve ser validada no backend.
- Toda operacao sensivel deve revalidar auth, permissao e contexto da sessao.

## Frontend
- O frontend nao deve decidir permissao real.
- O frontend nao deve aprovar pagamento.
- O frontend nao deve autorizar acao administrativa.
- O frontend nao deve montar valores finais de checkout como fonte de verdade.

## API e erros
- A API nao deve retornar stack trace em producao.
- A API nao deve retornar detalhes internos de banco, fila, storage ou provider externo.
- Toda resposta de erro deve ser segura para consumo publico.

## Uploads
- O backend deve validar tipo, extensao, tamanho e assinatura do arquivo antes de aceitar upload.
- O sistema nao deve confiar apenas no MIME enviado pelo client.
- O sistema nao deve aceitar executaveis ou formatos bloqueados.

## Admin
- Toda rota admin deve exigir auth, RBAC e 2FA.
- Toda acao critica de admin deve gerar auditoria.
- Toda acao critica de admin deve exigir step-up auth.

## Pagamentos
- O backend deve calcular total, desconto, frete e valor final.
- O backend nao deve confiar em valor enviado pelo client.
- O sistema nao deve confirmar pagamento por evento exclusivo de frontend.

## Regra final
- Se houver conflito entre conveniencia de implementacao e seguranca, prevalece a seguranca.
