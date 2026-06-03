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

# Instalação do FurMap 🐾

## Requisitos

* Ubuntu 22.04+ (recomendado)
* Acesso root
* Domínio (opcional)
* Nginx
* Node.js 20+
* Git

---

## Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Verifique:

```bash
node -v
npm -v
```

---

## Instalar Nginx

```bash
apt update
apt install -y nginx
```

Verifique:

```bash
systemctl status nginx
```

---

## Instalar PM2

```bash
npm install -g pm2
```

Verifique:

```bash
pm2 -v
```

---

## Baixar o FurMap

```bash
git clone https://github.com/ycooperzinho/FurryMAP.git
cd FurryMAP
```

---

## Executar o instalador

```bash
chmod +x install.sh
./install.sh
```

---

## Iniciar o FurMap

```bash
node server.js
```

Ou utilizando PM2:

```bash
pm2 start server.js --name furmap
pm2 save
```

---

## Configurar Nginx

Crie:

```bash
nano /etc/nginx/sites-available/furmap
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name seusite.com www.seusite.com;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Ative:

```bash
ln -s /etc/nginx/sites-available/furmap /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## SSL (HTTPS)

Instale:

```bash
apt install -y certbot python3-certbot-nginx
```

Execute:

```bash
certbot --nginx -d seusite.com -d www.seusite.com
```

---

## Atualização

```bash
git pull
npm install
pm2 restart furmap
```

---

## Recursos

* Login e cadastro
* Perfil de usuário
* Upload de foto
* Troca de senha
* Painel administrativo
* Mapa público
* Cluster de marcadores
* SQLite

---

## Licença

MIT License


## Licença

MIT License

## Autor

Desenvolvido por yCooper_ 🐾
