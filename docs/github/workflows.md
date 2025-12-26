# Documentação dos Workflows do GitHub

Este diretório contém a documentação dos workflows de CI/CD configurados no diretório `.github/workflows` deste projeto. Abaixo está a descrição detalhada de cada um deles.

## 1. Build and Publish Release Package (`build-and-publish-release-package.yml`)

**Gatilho:** Executado quando uma nova **release** é criada no GitHub.

**Função:**
Este workflow é responsável por empacotar a aplicação para distribuição.
- Configura o ambiente Node.js.
- Instala dependências do servidor e do cliente.
- Compila (build) o servidor e o cliente.
- Inclui arquivos de licença no pacote.
- Move o cliente compilado para o diretório de arquivos estáticos do servidor.
- Cria um arquivo `.zip` (`planka-prebuild.zip`) contendo a aplicação compilada.
- Faz o upload deste arquivo zip para a release criada no GitHub.

## 2. Build and Push Docker Image (`build-and-push-docker-image.yml`)

**Gatilho:** Executado quando uma nova **release** é criada no GitHub.

**Função:**
Este workflow constrói e publica a imagem Docker oficial da versão lançada.
- Configura QEMU e Docker Buildx para suporte a múltiplas plataformas.
- Faz login no GitHub Container Registry (ghcr.io).
- Extrai a versão da tag da release (removendo o 'v' inicial).
- Gera metadados e tags para a imagem Docker.
- Constrói a imagem Docker para as plataformas `linux/amd64`, `linux/arm64` e `linux/arm/v7`.
- Envia (push) a imagem para o registro com a tag da versão.

## 3. Build and Push Docker Nightly Image (`build-and-push-docker-nightly-image.yml`)

**Gatilho:**
- **Push** na branch `master` (ignorando alterações em documentação, charts e arquivos do github).
- **Disparo manual** (`workflow_dispatch`).

**Função:**
Este workflow mantém a imagem Docker "nightly" (versão de desenvolvimento) atualizada.
- Configura QEMU e Docker Buildx.
- Faz login no GitHub Container Registry.
- Gera a tag `nightly` para a imagem.
- Constrói a imagem Docker para múltiplas plataformas (`linux/amd64`, `linux/arm64`, `linux/arm/v7`).
- Envia a imagem para o registro com a tag `nightly`.

## 4. Build and Test (`build-and-test.yml`)

**Gatilho:**
- **Pull Request** para a branch `master`.
- **Push** na branch `master`.

**Função:**
Este workflow garante a integridade do código através de testes.
- Configura Node.js e um banco de dados PostgreSQL.
- Faz cache dos módulos Node.js para acelerar a execução.
- Instala dependências e compila o cliente.
- Inicia o servidor em modo de produção conectado ao banco de dados de teste.
- Aguarda o servidor iniciar.
- Popula o banco de dados com dados necessários (ex: assinatura dos termos).
- Executa testes de aceitação de UI usando Playwright.

## 5. Lint (`lint.yml`)

**Gatilho:** **Pull Request** para a branch `master`.

**Função:**
Este workflow verifica a qualidade e o estilo do código.
- Configura Node.js.
- Faz cache das dependências.
- Instala dependências.
- Executa o linter (`npm run lint`) para identificar problemas de estilo ou erros potenciais no código.

## 6. Release Charts (`release-helm-chart.yml`)

**Gatilho:** **Push** na branch `master` quando há alterações no diretório `charts/**`.

**Função:**
Este workflow gerencia o lançamento de Helm Charts.
- Configura Git e Helm.
- Adiciona repositórios de dependências do Helm.
- Usa a action `helm/chart-releaser-action` para empacotar e lançar novas versões dos charts Helm configurados no projeto.
