# FurMap 🐾

FurMap is a furry community map featuring profiles, photos, custom markers and an administration panel.

Since the original FurMap is no longer available, I decided to create my own version. The project is currently online and working, but I also made the entire source code public so the community can contribute, learn from it, or continue the project in the future.

If one day I stop developing FurMap, any furry will be able to continue the project and improve it even further.

I am still a beginner programmer, so the code is completely open for modifications and improvements. Feel free to adapt it however you like. UwU 🐾

---

# Features

* User registration and login
* User profiles
* Photo uploads
* Password changes
* Public map
* Custom markers
* Administration panel
* SQLite database
* Marker clustering for better performance

---

# Requirements

* Ubuntu 22.04+ (recommended)
* Root access
* Node.js 20+
* NPM
* Git
* Nginx
* PM2 (optional)
* Domain name (optional)

---

# Installation

## Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Verify installation:

```bash
node -v
npm -v
```

## Install Nginx

```bash
apt update
apt install -y nginx
```

## Install PM2

```bash
npm install -g pm2
```

## Download FurMap

```bash
git clone https://github.com/ycooperzinho/FurryMAP.git
cd FurryMAP
```

## Run the installer

```bash
chmod +x install.sh
./install.sh
```

## Start FurMap

```bash
node server.js
```

Or using PM2:

```bash
pm2 start server.js --name furmap
pm2 save
```

---

# Important

The following files are NOT included in the repository:

```text
database/
uploads/
.env
node_modules/
```

These files are installation-specific and will be created/configured locally.

The SQLite database is automatically generated when FurMap is started for the first time.

---

# Contributing

Feel free to open Issues, suggest improvements or submit Pull Requests.

The goal of this project is to keep an open-source alternative to the original FurMap alive and allow the furry community to continue improving it.

---

# License

MIT License

You are free to use, modify, distribute and adapt this project.

---

# Author

Developed by **yCooper_** 🐾

GitHub:
https://github.com/ycooperzinho

Thank you for helping keep FurMap alive ❤️


# FurMap 🐾

FurMap é um mapa da comunidade furry com perfis, fotos, marcadores e painel administrativo.

Como o FurMap original não existe mais, decidi criar minha própria versão. O projeto está online e funcionando, mas também deixei todo o código aberto para que a comunidade possa contribuir, aprender ou até continuar o projeto no futuro.

Caso um dia eu pare de desenvolver o FurMap, qualquer furry poderá continuar o trabalho e torná-lo ainda melhor.

Sou iniciante em programação, então o código está totalmente aberto para modificações e melhorias. Sinta-se livre para adaptar o projeto da forma que desejar. UwU 🐾

---

# Recursos

* Login e cadastro
* Perfil de usuário
* Upload de foto
* Troca de senha
* Mapa público
* Marcadores personalizados
* Painel administrativo
* Banco de dados SQLite
* Cluster de marcadores para melhor desempenho

---

# Requisitos

* Ubuntu 22.04+ (recomendado)
* Acesso root
* Node.js 20+
* NPM
* Git
* Nginx
* PM2 (opcional)
* Domínio (opcional)

---

# Instalação

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

Modo simples:

```bash
node server.js
```

Ou utilizando PM2:

```bash
pm2 start server.js --name furmap
pm2 save
```

---

# Configurar Nginx

Crie o arquivo:

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

Ative a configuração:

```bash
ln -s /etc/nginx/sites-available/furmap /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

# SSL (HTTPS)

Instale:

```bash
apt install -y certbot python3-certbot-nginx
```

Execute:

```bash
certbot --nginx -d seusite.com -d www.seusite.com
```

---

# Atualização

```bash
git pull
npm install
pm2 restart furmap
```

---

# Estrutura do Projeto

```text
FurryMAP/
├── public/
├── server.js
├── package.json
├── package-lock.json
├── install.sh
├── README.md
└── .gitignore
```

---

# Importante

Os seguintes arquivos NÃO são enviados para o GitHub:

```text
database/
uploads/
.env
node_modules/
```

Esses arquivos são específicos de cada instalação e serão criados/configurados localmente.

O banco de dados SQLite é gerado automaticamente quando o sistema é executado pela primeira vez.

---

# Contribuindo

Sinta-se livre para abrir Issues, sugerir melhorias ou enviar Pull Requests.

O objetivo deste projeto é manter viva uma alternativa aberta ao FurMap original e permitir que a comunidade furry possa continuar evoluindo a plataforma.

---

# Licença

MIT License

Você pode usar, modificar, distribuir e adaptar o projeto livremente.

---

# Autor

Desenvolvido por **yCooper_** 🐾

GitHub:
https://github.com/ycooperzinho

Obrigado por ajudar a manter o FurMap vivo. ❤️
