#!/bin/bash

echo "Atualizando sistema..."
apt update

echo "Instalando dependências..."
apt install -y git

echo "Verificando Node.js..."
node -v
npm -v

echo "Instalando dependências do projeto..."
npm install

echo "Criando pastas..."
mkdir -p database
mkdir -p uploads

echo ""
echo "Instalação concluída!"
echo ""
echo "Inicie com:"
echo "node server.js"