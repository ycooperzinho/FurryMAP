const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 9827;

const dbFolder = path.join(__dirname, "database");
const uploadFolder = path.join(__dirname, "public", "uploads", "profiles");

fs.mkdirSync(dbFolder, { recursive: true });
fs.mkdirSync(uploadFolder, { recursive: true });

const db = new sqlite3.Database(path.join(dbFolder, "furmap.db"));

function addColumnIfMissing(table, column, definition) {
  db.all(`PRAGMA table_info(${table})`, [], (err, cols = []) => {
    if (err) return console.error(`[DB] PRAGMA ${table}:`, err.message);

    if (!cols.some((c) => c.name === column)) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
        if (alterErr) console.error(`[DB] ${table}.${column}:`, alterErr.message);
      });
    }
  });
}

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    displayName TEXT,
    telegram TEXT,
    discord TEXT,
    city TEXT,
    phone TEXT,
    status TEXT,
    about TEXT,
    photo TEXT,
    isAdmin INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  [
    ["users", "email", "TEXT"],
    ["users", "displayName", "TEXT"],
    ["users", "telegram", "TEXT"],
    ["users", "discord", "TEXT"],
    ["users", "city", "TEXT"],
    ["users", "phone", "TEXT"],
    ["users", "status", "TEXT"],
    ["users", "about", "TEXT"],
    ["users", "photo", "TEXT"],
    ["users", "isAdmin", "INTEGER DEFAULT 0"],
    ["users", "createdAt", "TEXT DEFAULT CURRENT_TIMESTAMP"],
    ["markers", "createdAt", "TEXT DEFAULT CURRENT_TIMESTAMP"],
    ["markers", "updatedAt", "TEXT DEFAULT CURRENT_TIMESTAMP"],
  ].forEach(([t, c, d]) => addColumnIfMissing(t, c, d));
});

function deleteUploadedPhoto(photo) {
  if (!photo || !photo.startsWith("/uploads/profiles/")) return;

  const filePath = path.join(__dirname, "public", photo);

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("[UPLOAD DELETE ERROR]", err.message);
    }
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg").toLowerCase() || ".jpg";
    cb(null, `user-${req.session.userId || "guest"}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Envie apenas imagem."));
    }

    cb(null, true);
  },
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "furmap-secret-troque-depois",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
}));

app.use(express.static(path.join(__dirname, "public")));

function clean(v) {
  return String(v || "").trim();
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username || "",
    email: user.email || "",
    displayName: user.displayName || user.username || "Furry",
    telegram: user.telegram || "",
    discord: user.discord || "",
    city: user.city || "",
    phone: user.phone || "",
    status: user.status || "",
    about: user.about || "",
    photo: user.photo || "/img/default-avatar.svg",
    isAdmin: user.isAdmin === 1,
    createdAt: user.createdAt || "",
  };
}

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  db.get("SELECT isAdmin FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });

    if (!user || user.isAdmin !== 1) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    next();
  });
}

function safePoint(lat, lng) {
  const nlat = Number(lat);
  const nlng = Number(lng);

  if (!Number.isFinite(nlat) || !Number.isFinite(nlng)) return null;
  if (nlat < -90 || nlat > 90 || nlng < -180 || nlng > 180) return null;

  return { lat: nlat, lng: nlng };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, port: PORT });
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.json({ user: null });

  db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });
    if (!user) return res.json({ user: null });

    res.json({ user: publicUser(user) });
  });
});

app.post("/api/register", (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  const username = clean(req.body.username);
  const password = clean(req.body.password);

  if (!email || !username || !password) {
    return res.status(400).json({ error: "Preencha Gmail, usuário e senha." });
  }

  if (!email.endsWith("@gmail.com")) {
    return res.status(400).json({ error: "Use um Gmail válido terminando em @gmail.com." });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Usuário precisa ter pelo menos 3 letras." });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: "Senha precisa ter pelo menos 4 caracteres." });
  }

  db.get("SELECT id FROM users WHERE username = ? OR email = ?", [username, email], async (err, existing) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });
    if (existing) return res.status(400).json({ error: "Esse Gmail ou usuário já existe." });

    const hash = await bcrypt.hash(password, 10);

    db.get("SELECT COUNT(*) AS total FROM users", [], (countErr, row) => {
      if (countErr) return res.status(500).json({ error: "Erro no servidor." });

      const isAdmin = row.total === 0 ? 1 : 0;

      db.run(
        "INSERT INTO users (email, username, password, displayName, isAdmin) VALUES (?, ?, ?, ?, ?)",
        [email, username, hash, username, isAdmin],
        function (insertErr) {
          if (insertErr) return res.status(500).json({ error: "Erro ao criar conta." });

          req.session.userId = this.lastID;

          res.json({
            message: isAdmin ? "Conta criada. Você é o admin principal." : "Conta criada.",
            user: {
              id: this.lastID,
              username,
              email,
              isAdmin: !!isAdmin,
            },
          });
        }
      );
    });
  });
});

app.post("/api/login", (req, res) => {
  const login = clean(req.body.login || req.body.username || req.body.email);
  const password = clean(req.body.password);

  if (!login || !password) {
    return res.status(400).json({ error: "Preencha usuário/Gmail e senha." });
  }

  db.get("SELECT * FROM users WHERE username = ? OR email = ?", [login, login.toLowerCase()], async (err, user) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });
    if (!user) return res.status(401).json({ error: "Login ou senha incorretos." });

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) return res.status(401).json({ error: "Login ou senha incorretos." });

    req.session.userId = user.id;

    res.json({
      message: "Login realizado.",
      user: publicUser(user),
    });
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Você saiu." });
  });
});

app.put("/api/profile", requireLogin, (req, res) => {
  const fields = ["displayName", "telegram", "discord", "city", "phone", "status", "about"].map((k) => clean(req.body[k]));

  db.run(
    "UPDATE users SET displayName=?, telegram=?, discord=?, city=?, phone=?, status=?, about=? WHERE id=?",
    [...fields, req.session.userId],
    (err) => {
      if (err) return res.status(500).json({ error: "Erro ao salvar perfil." });

      res.json({ message: "Perfil salvo." });
    }
  );
});

function saveUploadedPhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: "Envie uma foto." });

  const newPhoto = `/uploads/profiles/${req.file.filename}`;

  db.get("SELECT photo FROM users WHERE id = ?", [req.session.userId], (findErr, user) => {
    if (findErr) {
      deleteUploadedPhoto(newPhoto);
      return res.status(500).json({ error: "Erro ao buscar foto antiga." });
    }

    const oldPhoto = user?.photo;

    db.run("UPDATE users SET photo = ? WHERE id = ?", [newPhoto, req.session.userId], (err) => {
      if (err) {
        deleteUploadedPhoto(newPhoto);
        return res.status(500).json({ error: "Erro ao salvar foto." });
      }

      if (oldPhoto && oldPhoto !== newPhoto) {
        deleteUploadedPhoto(oldPhoto);
      }

      res.json({
        message: "Foto enviada.",
        photo: newPhoto,
      });
    });
  });
}

app.post("/api/profile/photo", requireLogin, upload.single("photo"), saveUploadedPhoto);
app.post("/api/upload-photo", requireLogin, upload.single("photo"), saveUploadedPhoto);

app.get("/api/users/:id", (req, res) => {
  db.get(
    `SELECT users.*, markers.lat, markers.lng
     FROM users
     LEFT JOIN markers ON markers.userId = users.id
     WHERE users.id = ?`,
    [Number(req.params.id)],
    (err, user) => {
      if (err) return res.status(500).json({ error: "Erro no servidor." });
      if (!user) return res.status(404).json({ error: "Perfil não encontrado." });

      res.json({
        user: publicUser(user),
        marker: user.lat != null && user.lng != null ? { lat: user.lat, lng: user.lng } : null,
      });
    }
  );
});

app.get("/api/markers", (_req, res) => {
  db.all(
    `SELECT markers.id AS markerId,
            markers.userId AS markerUserId,
            markers.lat,
            markers.lng,
            users.*
     FROM markers
     JOIN users ON users.id = markers.userId
     ORDER BY markers.updatedAt DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erro ao buscar marcadores." });

      res.json({
        markers: rows.map((r) => ({
          id: r.markerId,
          lat: r.lat,
          lng: r.lng,
          user: publicUser(r),
        })),
      });
    }
  );
});

app.post("/api/markers", requireLogin, (req, res) => {
  const p = safePoint(req.body.lat, req.body.lng);

  if (!p) {
    return res.status(400).json({ error: "Local inválido." });
  }

  const margem = 0.004;

  const safeLat = p.lat + (Math.random() - 0.5) * margem;
  const safeLng = p.lng + (Math.random() - 0.5) * margem;

  db.run(
    `INSERT INTO markers (userId, lat, lng, updatedAt)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(userId)
     DO UPDATE SET
     lat=excluded.lat,
     lng=excluded.lng,
     updatedAt=CURRENT_TIMESTAMP`,
    [req.session.userId, safeLat, safeLng],
    (err) => {
      if (err) return res.status(500).json({ error: "Erro ao salvar marcador." });

      res.json({
        message: "Marcador salvo.",
        marker: {
          lat: safeLat,
          lng: safeLng,
        },
      });
    }
  );
});

app.delete("/api/markers/me", requireLogin, (req, res) => {
  db.run("DELETE FROM markers WHERE userId = ?", [req.session.userId], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao apagar marcador." });

    res.json({ message: "Marcador apagado." });
  });
});

app.get("/api/admin/users", requireAdmin, (_req, res) => {
  db.all(
    `SELECT users.*, markers.lat, markers.lng
     FROM users
     LEFT JOIN markers ON markers.userId = users.id
     ORDER BY users.id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erro ao buscar usuários." });

      res.json({
        users: rows.map((u) => ({
          ...publicUser(u),
          hasMarker: u.lat != null && u.lng != null,
        })),
      });
    }
  );
});

app.put("/api/admin/users/:id", requireAdmin, (req, res) => {
  const fields = ["displayName", "telegram", "discord", "city", "phone", "status", "about"].map((k) => clean(req.body[k]));
  const isAdmin = req.body.isAdmin ? 1 : 0;

  db.run(
    "UPDATE users SET displayName=?, telegram=?, discord=?, city=?, phone=?, status=?, about=?, isAdmin=? WHERE id=?",
    [...fields, isAdmin, Number(req.params.id)],
    (err) => {
      if (err) return res.status(500).json({ error: "Erro ao editar usuário." });

      res.json({ message: "Usuário editado." });
    }
  );
});

app.delete("/api/admin/users/:id/photo", requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  db.get("SELECT photo FROM users WHERE id = ?", [id], (err, user) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar usuário." });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const oldPhoto = user.photo;

    db.run("UPDATE users SET photo = NULL WHERE id = ?", [id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: "Erro ao remover foto." });

      deleteUploadedPhoto(oldPhoto);

      res.json({ message: "Foto removida." });
    });
  });
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const deletingSelf = id === req.session.userId;

  db.get("SELECT photo FROM users WHERE id = ?", [id], (findErr, user) => {
    if (findErr) return res.status(500).json({ error: "Erro ao buscar usuário." });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const oldPhoto = user.photo;

    db.serialize(() => {
      db.run("DELETE FROM markers WHERE userId = ?", [id]);

      db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao deletar usuário." });

        deleteUploadedPhoto(oldPhoto);

        if (deletingSelf) {
          return req.session.destroy(() => {
            res.json({ message: "Sua própria conta admin foi deletada." });
          });
        }

        res.json({ message: "Usuário deletado." });
      });
    });
  });
});

app.delete("/api/admin/users/:id/marker", requireAdmin, (req, res) => {
  db.run("DELETE FROM markers WHERE userId = ?", [Number(req.params.id)], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao deletar marcador." });

    res.json({ message: "Marcador deletado." });
  });
});

app.put("/api/profile/password", requireLogin, async (req, res) => {
  const currentPassword = clean(req.body.currentPassword);
  const newPassword = clean(req.body.newPassword);
  const confirmPassword = clean(req.body.confirmPassword);

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Preencha todos os campos." });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: "A nova senha precisa ter pelo menos 4 caracteres." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "As senhas novas não são iguais." });
  }

  db.get("SELECT password FROM users WHERE id = ?", [req.session.userId], async (err, user) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const ok = await bcrypt.compare(currentPassword, user.password);

    if (!ok) {
      return res.status(401).json({ error: "Senha atual incorreta." });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    db.run("UPDATE users SET password = ? WHERE id = ?", [hash, req.session.userId], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: "Erro ao trocar senha." });

      res.json({ message: "Senha alterada com sucesso." });
    });
  });
});

app.use((err, _req, res, _next) => {
  console.error("[APP ERROR]", err.message);

  res.status(400).json({
    error: err.message || "Erro no servidor.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FurMAP rodando na porta ${PORT}`);
});