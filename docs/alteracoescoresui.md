# Guia de Personalização de Cores da UI (Neural Interface)

Este documento descreve as estratégias eficazes identificadas durante o desenvolvimento para aplicar estilos personalizados (especialmente cores) em um ambiente que utiliza **React**, **SCSS Modules**, **Semantic UI** e **Gravity UI**, onde muitas vezes as classes são ofuscadas ou controladas por bibliotecas externas.

## Estratégias de Estilização

### 1. Seletores Ancorados (Anchored Selectors)

Para evitar conflitos globais e garantir que seus estilos se apliquem apenas ao componente desejado, sempre ancore seus seletores CSS numa classe "wrapper" local do CSS Module.

**Exemplo:**
O arquivo `CardModal.module.scss` define uma classe `.wrapper`. Ao compilar, isso vira algo como `_wrapper_xyz123`.

```scss
/* Correto: Ancorado no wrapper local */
.wrapper {
  :global(.ui.button) {
    /* Estilos afetam apenas botões DENTRO deste modal */
    background: transparent !important;
  }
}

/* Incorreto: Afeta o app inteiro */
:global(.ui.button) {
  background: red;
}
```

### 2. Atributos de Dados (Data Attributes)

Para componentes que você controla (ex: `CustomField.jsx`), a maneira mais robusta de estilizar é adicionar atributos `data-role`. Isso ignora completamente o hash de classes do CSS Modules.

**No React (`CustomField.jsx`):**
```jsx
<div className={styles.name} data-role="custom-field-name">Example</div>
<div className={styles.value} data-role="custom-field-value">Value</div>
```

**No SCSS (`CardModal.module.scss`):**
```scss
/* Seletor específico e à prova de build */
:global([data-role="custom-field-name"]) {
  color: #89CFF0 !important;
}
```

### 3. Seletores Wildcard para Classes Ofuscadas

Quando você não pode alterar o componente (ex: bibliotecas de terceiros ou estruturas complexas) e as classes mudam (ex: `_headerTitleWrapper_18mkx`), use seletores de atributo com wildcard (`*=`).

**Cenário:** O título do card está em `div._headerTitleWrapper_18mkx > textarea`.

**Solução SCSS:**
```scss
/* Busca qualquer classe que CONTENHA "headerTitleWrapper" */
:global([class*="headerTitleWrapper"]) {
  :global(textarea) {
    color: #ffffff !important;
  }
}
```

### 4. Estilizando Conteúdo Gerado (Markdown/YFM)

Conteúdo renderizado dinamicamente (com `dangerouslySetInnerHTML` ou parsers de Markdown) geralmente possui classes fixas, mas não herda estilos do módulo automaticamente.

**Solução:** Mire na classe raiz do gerador (ex: `.yfm`) e estilize as tags HTML filhas explicitamente.

```scss
:global(.yfm) {
  color: #ffffff !important;

  /* Labels simuladas com negrito */
  :global(strong) {
    color: #89CFF0 !important;
  }

  /* Garantir cor em todos os elementos de texto */
  :global(p), :global(li), :global(span) {
    color: #ffffff !important;
  }
}
```

### 5. Forçando Cores em Inputs/Textareas

Navegadores e bibliotecas muitas vezes forçam cores em inputs. Para garantir o estilo "Neural Interface" (fundo escuro, texto claro):

1.  Use `!important`.
2.  Use `-webkit-text-fill-color` (crucial para alguns estados do Chrome/Safari).
3.  Defina `caret-color` para o cursor ficar visível.
4.  Estilize o `placeholder` separadamente.

```scss
:global(textarea) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff;
  caret-color: #ffffff; /* Cor do cursor piscando */
}

:global(textarea::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.6);
}
```

## Paleta de Cores "Neural Interface"

Use estas cores para manter a consistência do tema:

*   **Fundo Glassmorphism:** `rgba(10, 10, 15, 0.95)` com `backdrop-filter: blur(24px)` e borda `rgba(255, 255, 255, 0.08)`.
*   **Títulos / Labels / Destaques:** `#89CFF0` (Light Blue) ou `#1ac9cc` (Teal Neon em hover/foco).
*   **Texto Geral / Valores:** `#FFFFFF` (Branco).
*   **Placeholders / Ícones Inativos:** `rgba(255, 255, 255, 0.6)`.

---
*Documento gerado com base nas correções aplicadas ao CardModal e CustomFields.*
