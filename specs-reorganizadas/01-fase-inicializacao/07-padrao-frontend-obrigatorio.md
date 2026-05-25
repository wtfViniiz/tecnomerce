# Fase 1 - Padrao Frontend Obrigatorio

## Regra
Este arquivo define o padrao obrigatorio de frontend para `apps/web` e `apps/admin`. A LLM nao deve criar outra organizacao, outra convencao de nomes ou outra estrategia de composicao sem revisao explicita desta especificacao.

## Estrutura obrigatoria de `apps/web`
```txt
apps/
  web/
    src/
      app/
      components/
        ui/
        layouts/
        feedback/
        navigation/
      features/
        auth/
        catalog/
        cart/
        checkout/
        fabrics/
        customization/
        account/
      services/
      hooks/
      lib/
      stores/
      schemas/
      types/
      constants/
      styles/
```

## Estrutura obrigatoria de `apps/admin`
```txt
apps/
  admin/
    src/
      app/
      components/
      features/
        dashboard/
        products/
        banners/
        coupons/
        shipping/
        users/
        analytics/
        permissions/
      services/
      hooks/
      lib/
      stores/
      schemas/
      types/
      styles/
```

## Padrao de pastas de componentes
- `components/ui/`: componentes genericos reutilizaveis
- `components/layouts/`: navbar, footer, sidebar, wrappers e shells
- `components/feedback/`: skeletons, empty states, banners, alerts e estados de erro
- `components/navigation/`: menus, breadcrumbs, tabs e paginacao visual
- `features/`: regras, componentes, schemas, forms e fluxos de dominio
- `forms/`: campos e composicoes integradas com React Hook Form quando a feature exigir
- `tables/`: tabelas reutilizaveis com filtros, colunas e acoes

## Convencao obrigatoria de nomes
- Componentes React: `PascalCase.tsx`
- Hooks: `use-something.ts` nao e permitido; o padrao obrigatorio e `useSomething.ts`
- Stores: `something-store.ts`
- Schemas: `something.schema.ts`
- DTOs: `SomethingDto.ts`
- Services: `something.service.ts`
- Server actions: `something.action.ts`
- Utilitarios: `something.util.ts`

## Regra de renderizacao
- Tudo comeca como Server Component.
- Client Component so pode existir quando houver estado, evento, hook React, animacao, upload, personalizacao, carrinho ou filtro dinamico.
- Paginas de catalogo, produto, categoria, tecidos, institucionais e SEO devem nascer server-first.

## Estrategia obrigatoria de fetch
- Server fetch: catalogo, produto, categorias, tecidos e paginas de SEO
- TanStack Query: carrinho, sessao, notificacoes, dashboard admin, tabelas, filtros dinamicos, sincronizacao por SSE e mutations

## Formularios
- Stack obrigatorio: React Hook Form + Zod + `@hookform/resolvers`
- Toda feature com formulario deve separar `forms/` e `schemas/`
- Exemplo de estrutura:

```txt
features/auth/forms/login-form.tsx
features/auth/schemas/login.schema.ts
```

## Design system

### Tokens obrigatorios
- radius:
  - `sm`: `8px`
  - `md`: `12px`
  - `lg`: `16px`
  - `xl`: `24px`
- spacing:
  - multiplos de `4px`
- shadow:
  - `soft`
  - `medium`
  - `floating`
- transition:
  - `150ms`
  - `250ms`
  - `ease-out`

### Paleta obrigatoria
- preto: fundo principal
- branco: contraste
- vermelho escuro: destaque
- cinza carvao: superficies
- vermelho vinho: hover e accent

### Typography obrigatoria
- headings: `font-bold` + `tracking-tight`
- body: `font-medium` + `leading-relaxed`

## Tabelas
Toda tabela reutilizavel deve incluir:
- loading state
- empty state
- error state
- paginacao
- filtros
- busca com debounce
- column visibility
- row actions

## CSS rules obrigatorias
- Stack: Tailwind + `clsx` + `tailwind-merge` + `class-variance-authority`
- Ordem de classes:
  - layout
  - spacing
  - sizing
  - typography
  - colors
  - effects
  - states

## Imports
- Import absoluto obrigatorio com alias `@/`
- Import relativo profundo como `../../../` e proibido

## Comentarios
- Permitidos apenas para decisoes arquiteturais, regras criticas, seguranca e edge cases
- Comentarios obvios sao proibidos
