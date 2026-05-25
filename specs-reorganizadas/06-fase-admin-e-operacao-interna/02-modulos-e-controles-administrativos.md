# Fase 6 - Modulos e Controles Administrativos

## Modulos minimos
- dashboard
- products
- orders
- customers
- coupons
- shipping
- banners
- analytics
- settings
- logs
- system

## Regras de acesso
- toda rota admin exige auth + RBAC + 2FA admin
- acoes perigosas exigem step-up auth
- toda acao critica gera auditoria imutavel
- o frontend admin nao deve ser tratado como ambiente confiavel
- validacoes de permissao, ownership e impacto devem acontecer no backend admin

## Regras operacionais
- tabelas com busca, filtro, sort e paginacao server-side
- bulk actions apenas onde fizer sentido e com auditoria
- exportacao CSV/XLSX para dados definidos
- widgets de observabilidade tecnica dentro do admin
