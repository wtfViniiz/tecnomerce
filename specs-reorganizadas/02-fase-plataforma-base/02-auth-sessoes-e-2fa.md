# Fase 2 - Auth, Sessoes e 2FA

## Objetivo
Definir a base real de autenticacao, rotacao de sessao e protecao de contas privilegiadas.

## Componentes obrigatorios
- login
- refresh
- logout
- logout all sessions
- revoke session
- list sessions
- 2FA admin por TOTP
- backup codes

## Regras canonicas
- access token `RS256`, 15 min
- refresh token opaco, hash `Argon2id`
- cookie `HttpOnly`, `Secure`, `SameSite=Strict`, `path=/api/auth/` ou equivalente versionado
- rotacao de refresh em transacao unica
- reuse detection obrigatorio
- sessao com `ipAddress`, `userAgent`, `deviceName`, `lastSeenAt`
- refresh token nao deve ser retornado em payload JSON
- hash, secret, seed, backup code hash e claims internas nao devem ser expostos ao frontend

## Fluxo de login
1. usuario envia credenciais
2. backend valida usuario e senha
3. se a conta exigir 2FA, retorna estado intermediario de desafio
4. backend so cria sessao final apos validar 2FA
5. backend gera access token e refresh token
6. backend registra auditoria

## Regras adicionais de seguranca
- o backend deve validar credenciais e contexto da sessao sem depender de qualquer afirmacao do client
- o sistema nao deve expor se o erro foi usuario inexistente, senha incorreta ou conta conhecida quando isso aumentar superficie de enumeracao
- backup codes em texto puro so podem existir no instante de entrega inicial ao usuario autorizado

## Fluxo de refresh
1. ler refresh token do cookie
2. localizar sessao pelo hash/token strategy definida
3. validar expiracao e revogacao
4. validar encadeamento da sessao
5. gerar novos tokens
6. persistir nova chain de modo atomico
7. emitir auditoria

## Fluxo de logout
1. invalidar sessao atual
2. limpar cookie
3. registrar auditoria

## 2FA admin
- obrigatorio para contas admin
- segredo TOTP criptografado com `AES-256-GCM`
- janela de validacao `+/- 1`
- backup codes single-use com hash `Argon2id`
- rate limit dedicado para login, TOTP e backup code

## Checklist
- [ ] login seguro definido
- [ ] refresh com reuse detection definido
- [ ] sessoes multi-device definidas
- [ ] 2FA admin definido
- [ ] auditoria de auth definida
