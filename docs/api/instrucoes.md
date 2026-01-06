# 1) Buscar a URL de autorização OIDC do Planka
curl -sS 'https://task.bolt360.com.br/api/bootstrap'

# 2) Gere um nonce (exemplo simples) e abra no navegador a URL retornada em:
#    item.oidc.authorizationUrl  +  "&state=QUALQUER_COISA&nonce=SEU_NONCE"
#    Depois do login, você será redirecionado para:
#    https://task.bolt360.com.br/oidc-callback#code=...&state=...

# 3) Trocar o code por um access token do Planka (substitua CODE_DO_CALLBACK e NONCE_USADO)
curl -sS -X POST 'https://task.bolt360.com.br/api/access-tokens/exchange-with-oidc' \
  -H 'Content-Type: application/json' \
  -d '{"code":"CODE_DO_CALLBACK","nonce":"NONCE_USADO","withHttpOnlyToken":false}'
