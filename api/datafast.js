// v3
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.DATAFAST_API_KEY || 'dak_8a4b38fd181b6784a6718bc2bf5fbb62_4d066b97';
  const BMG_USER = process.env.BMG_USUARIO || 'sp.56863.34921564876';
  const BMG_PASS = process.env.BMG_SENHA || 'Fabri15*/4';
  const BASE = 'https://api.dataconsulta.com.br';

  const { cpfs } = req.body;
  if (!cpfs || !Array.isArray(cpfs) || cpfs.length === 0) {
    return res.status(400).json({ error: 'cpfs array obrigatorio' });
  }

  let token;
  try {
    const loginRes = await fetch(`${BASE}/v1/bmgconsig/saquecartao/login`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ autenticacao: { usuario: BMG_USER, senha: BMG_PASS } })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    if (!token) {
      return res.status(401).json({ error: 'Login falhou', detail: loginData, user: BMG_USER });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erro no login', detail: err.message });
  }

  const resultados = [];
  for (const cpf of cpfs) {
    try {
      const r = await fetch(`${BASE}/v1/bmgconsig/saquecartao`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'X-Api-Key': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ convenio: 'INSS', cpf: String(cpf), dadosCadastrais: true })
      });
      const data = await r.json();
      resultados.push({ cpf, status: r.status, data });
    } catch (err) {
      resultados.push({ cpf, status: 500, data: null, error: err.message });
    }
  }

  try {
    await fetch(`${BASE}/v1/bmgconsig/saquecartao/logout`, {
      method: 'POST',
      headers: { 'X-Api-Key': API_KEY, 'Authorization': `Bearer ${token}` }
    });
  } catch (_) {}

  return res.status(200).json({ resultados });
}
