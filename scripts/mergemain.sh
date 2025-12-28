#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]; then
    echo "Erro: Você deve fornecer uma mensagem de commit."
    echo "Uso: ./scripts/mergemain.sh \"sua mensagem aqui\""
    exit 1
fi

COMMIT_MSG="$*"

echo "--- Iniciando processo de merge para main ---"

# 1. Add all changes
echo "Step 1 (em bolt/develop): git add ."
git add .

# 2. Commit with provided message
echo "Step 2: git commit -m \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

# 3. Push current branch (assuming develop)
echo "Step 3: git push (develop)"
git push

# 4. Checkout to main
echo "Step 4: git checkout bolt/main"
git checkout bolt/main

# 5. Merge develop into main
echo "Step 5: git merge bolt/develop"
git merge bolt/develop

# 6. Push main
echo "Step 6: git push (bolt/main)"
git push

# 7. Back to develop
echo "Step 7: git checkout bolt/develop"
git checkout bolt/develop

echo "--- Processo concluído com sucesso! ---"
