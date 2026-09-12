# Arquitetura Técnica — Sistema de Gestão de Portfólio FE / ONS

## Objetivo
Evoluir a baseline HTML atual para uma aplicação persistente sem reconstruir a experiência do zero.

## Arquitetura alvo

```text
UI HTML/JS
   ↓
Services / Rules
   ↓
Repositories
   ↓
Supabase API / PostgreSQL
   ↓
Histórico / Snapshots / Views executivas
```

## Princípios
- O Portfólio FE é camada estratégica/gerencial.
- Azure DevOps, Jira, ITSM e sistemas oficiais continuam responsáveis pela execução operacional.
- Nenhum peso, score, escala, meta ou semáforo é tratado como regra oficial sem fonte/validação.
- Toda regra relevante deve indicar: `FONTE_ONS`, `DECISAO_FUNCIONAL_PRODUTO` ou `A_VALIDAR_FEG`.
- Persistência deve ser desacoplada da UI por Repository Pattern.
- Segurança deve existir no backend/banco, não apenas na interface.

## Domínio principal
Gerências → Comunidades → Squads → Ferramentas → Iniciativas.

Entidades complementares: avaliações, dependências, riscos/impedimentos, capacidade, financeiro, fóruns, decisões, snapshots, parâmetros e histórico.

## Ambientes
- DEV: dados fictícios/controlados.
- HML: homologação futura.
- PRD: somente após definição de infraestrutura e segurança pelo ONS.

## Fonte documental
A documentação funcional do Drive (00–10) e a série técnica 11.x são a referência de negócio durante a implementação.
