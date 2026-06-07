# Debug Session: localhost-white-screen

Status: OPEN

## Sintoma
- Tela branca em `localhost`.
- Console mostra `Failed to load resource: net::ERR_CONNECTION_REFUSED` para `:1337/api/bootstrap`.
- Saga `initializeLogin` falha com `TypeError: Failed to fetch`.

## Hipoteses Iniciais
1. O servidor backend nao esta em execucao na porta `1337`, entao o client sobe mas o bootstrap falha imediatamente.
2. O backend esta em execucao, mas em outra porta/host diferente do esperado pelo client.
3. O `BASE_URL` ou alguma configuracao local de ambiente esta apontando para `:1337` sem haver um servidor ativo ali.
4. O backend falha ao iniciar por erro de configuracao/dependencia, deixando apenas o frontend no ar.
5. Alguma alteracao recente no fluxo de bootstrap/login passou a nao tratar a indisponibilidade da API, causando tela branca em vez de fallback visual.

## Evidencias Coletadas
- Pendente.

## Proximo Passo
- Verificar scripts de execucao, configuracao de porta e se o backend sobe localmente.
