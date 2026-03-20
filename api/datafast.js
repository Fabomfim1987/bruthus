// v5
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = 'dak_8a4b38fd181b6784a6718bc2bf5fbb62_4d066b97';
  const BMG_USER = 'sp.56863.34921564876';
  const BMG_PASS = 'Fabri15*/4';
  const BASE = 'https://api.dataconsulta.com.br';

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) {}
  }

  const cpfs = body?.cpfs;
  if (!cpfs || !Array.isArray(cpfs) || cpfs.length === 0) {
    return res.status(400).json({ error: 'cpfs array obrigatorio' });
  }

  // LOGIN
  let token;
  try {
    const loginPayload = { autenticacao: { usuario: BMG_USER, senha: BMG_PASS } };
    const loginBody = JSON.stringify(loginPayload);
    
    const loginRes = await fetch(`${BASE}/v1/bmgconsig/saquecartao/login`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginBody).toString()
      },
      body: loginBody
    });

    const loginText = await loginRes.text();
    
    // Retorna diagnóstico completo para debug
    let loginData;
    try { loginData = JSON.parse(loginText); } catch(e) { loginData = { raw: loginText }; }
    
    token = loginData.token;
    
    if (!token) {
      return res.status(200).json({ 
        debug: true,
        loginStatus: loginRes.status,
        loginResponse: loginData,
        sentUser: BMG_USER,
        sentPayloadKeys: Object.keys(loginPayload.autenticacao)
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erro no login', detail: err.message });
  }

  // CONSULTA
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

  // LOGOUT
  try {
    await fetch(`${BASE}/v1/bmgconsig/saquecartao/logout`, {
      method: 'POST',
      headers: { 'X-Api-Key': API_KEY, 'Authorization': `Bearer ${token}` }
    });
  } catch (_) {}

  return res.status(200).json({ resultados });
}
