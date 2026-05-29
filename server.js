const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o teu banco PostgreSQL local que aparece na imagem
const pool = new Pool({
    user: 'postgres',          // O teu utilizador do Postgres (geralmente postgres)
    host: '127.0.0.1',
    database: 'cinema',        // O banco que criaste
    password: 'A_TUA_SENHA_DO_POSTGRES_AQUI', // Troca pela senha que definiste ao instalar o Postgres
    port: 5432,
});

// ROTA: Criar Conta (Cadastro)
app.post('/api/usuarios/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const usuarioExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (usuarioExiste.rows.length > 0) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }
        await pool.query('INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)', [nome, email, senha]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Fazer Login
app.post('/api/usuarios/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await pool.query('SELECT id, nome, email FROM usuarios WHERE email = $1 AND senha = $2', [email, senha]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Pegar todas as Críticas
app.get('/api/criticas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM criticas ORDER BY criado_em DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Adicionar Nova Crítica
app.post('/api/criticas', async (req, res) => {
    const { titulo, tipo, nota, selo_editorial, feedback, autor } = req.body;
    try {
        await pool.query(
            'INSERT INTO criticas (titulo, tipo, nota, selo_editorial, feedback, autor) VALUES ($1, $2, $3, $4, $5, $6)',
            [titulo, tipo, nota, selo_editorial, feedback, autor]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Servidor BD rodando na porta 3000!'));