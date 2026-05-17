const express = require('express');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('./tokens.db');

const TELEGRAM_LINK = 'https://t.me/sup3rtentaca0_bot';

// Criação da tabela de tokens
db.prepare(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE,
    valor REAL,
    user TEXT,
    plano TEXT,
    used INTEGER DEFAULT 0
  )
`).run();

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(csrf({ cookie: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware de autenticação
function autenticaUser(req, res, next) {
  const user = req.cookies.userID;
  if (!user) return res.redirect('/sem-autorizacao.html');
  req.userID = user;
  next();
}

// Rota de geração de token
app.get('/gera', autenticaUser, (req, res) => {
  try {
    const plano = String(req.query.plano || '').trim();
    const valor = parseFloat(req.query.valor);
    const user = req.userID;

    if (!plano || isNaN(valor) || !/^[a-zA-Z0-9_-]{1,30}$/.test(plano)) {
      return res.redirect('/sem-autorizacao.html');
    }

    const existente = db.prepare(`
      SELECT token FROM tokens 
      WHERE user = ? AND plano = ? 
      ORDER BY id DESC LIMIT 1
    `).get(user, plano);

    if (existente) {
      return res.redirect(TELEGRAM_LINK);
    }

    let token;
    do {
      token = crypto.randomBytes(8).toString('hex');
    } while (db.prepare('SELECT 1 FROM tokens WHERE token = ?').get(token));

    db.prepare(
      'INSERT INTO tokens (token, valor, user, plano) VALUES (?, ?, ?, ?)'
    ).run(token, valor, user, plano);

    return res.redirect(TELEGRAM_LINK);
  } catch (err) {
    console.error('Erro ao gerar token:', err);
    return res.redirect('/erro');
  }
});

// Página de obrigado
app.get('/obrigado', autenticaUser, (req, res) => {
  const token = req.query.token;
  if (!token) return res.redirect('/expirado');

  const row = db.prepare('SELECT * FROM tokens WHERE token = ?').get(token);
  if (!row || row.used) {
    return res.redirect('/expirado');
  }

  db.prepare('UPDATE tokens SET used = 1 WHERE token = ?').run(token);

  const { valor, plano } = row;
  res.render('obrigado', { token, valor, plano });
});

// Página de login
app.get('/login', (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
});

app.post('/login', (req, res) => {
  const user = req.body.user;
  const senha = req.body.senha;

  if (!user || !senha) {
    return res.render('erro', { mensagem: 'Credenciais inválidas.' });
  }

  res.cookie('userID', user, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.redirect('/planos');
});

// Página com planos
app.get('/planos', autenticaUser, (req, res) => {
  res.render('planos');
});

// Página de token inválido
app.get('/expirado', (req, res) => {
  res.render('expirado');
});

// Página de erro genérica
app.get('/erro', (req, res) => {
  res.render('erro', { mensagem: 'Algo deu errado.' });
});

// Página de entrada define cookie e redireciona para landing padrão
app.get('/', (req, res) => {
  let user = req.cookies.userID;

  if (!user) {
    user = crypto.randomBytes(6).toString('hex');
    res.cookie('userID', user, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 dias
    });
  }

  return res.redirect('/hadrielle-maria1');
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
