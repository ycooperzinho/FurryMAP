# FurMap 🐾

Mapa da comunidade furry com perfis, fotos, marcadores e painel administrativo.
Como o FurMAP original nao existe mais eu decidi fazer o meu mas assim o meu esta no ar, e por que eu coloquei o codigo dele online
Para que se um dia eu desisitir do projeto algum outro furry possa continuar e fazer melhor que o meu.
Lembrando sou iniciante entao o codigo e todo aberto para que voces possam modificar do jeito que preferir uwu.

## Recursos

* Login e cadastro
* Perfil de usuário
* Upload de foto
* Troca de senha
* Mapa público
* Marcadores personalizados
* Painel administrativo
* Banco de dados SQLite
* Cluster de marcadores para melhor desempenho

## Requisitos

* Ubuntu 22.04+ (recomendado)
* Node.js 20+
* NPM
* PM2 (opcional)

## Instalação

Clone o projeto:

```bash
git clone https://github.com/ycooperzinho/FurryMAP.git
cd FurryMAP
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
node server.js
```

Ou utilizando PM2:

```bash
pm2 start server.js --name furmap
```

## Atualização

```bash
git pull
npm install
pm2 restart furmap
```

## Banco de dados

O FurMap utiliza SQLite.

O banco será criado automaticamente na pasta:

```text
database/
```

## Estrutura

```text
public/
database/
server/
server.js
package.json
```

## Licença

MIT License

## Autor

Desenvolvido por yCooper_ 🐾
