# Fase 1 - Glossario e Regras Transversais

## Glossario rapido
- `access token`: token curto para autenticar requests
- `refresh token`: token opaco de renovacao de sessao
- `session chain`: encadeamento criptografico de refresh rotations
- `RBAC`: autorizacao por roles e permissions
- `step-up auth`: revalidacao forte para operacoes sensiveis
- `snapshot`: copia imutavel dos dados de produto/preco no momento da compra
- `embedded checkout`: pagamento dentro do site, sem redirecionar o cliente
- `source of truth`: origem autoritativa do estado

## Regras transversais do projeto
- sem `any`
- sem mocks tecnicos para fluxo real
- sem segredo hardcoded
- sem log de senha, token, cookie ou dado de cartao
- sem exposicao de hash, secret, chave privada ou credencial interna para o frontend
- sem endpoint sem validacao
- sem confiar em validacao feita no client
- sem regra de negocio no controller
- sem dependencia de memoria local para sessao, fila ou cache critico
- sem filesystem local como storage persistente

## Regras de consistencia
- toda fase precisa declarar dependencias
- toda fase precisa listar entregaveis verificaveis
- toda integracao externa precisa ter estrategia de timeout, retry e auditoria
- toda alteracao de estado critico precisa ser rastreavel
- toda regra de seguranca critica precisa ser aplicada no backend
