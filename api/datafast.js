export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { endpoint, body } = req.body;

  const ALLOWED = ['/v1/bmgconsig/saquecartao', '/v1/bmg/saquecartao'];
  if (!ALLOWED.includes(endpoint)) {
    return res.status(400).json({ error: 'Endpoint nao permitido' });
  }

  try {
    const response = await fetch(`https://app.processa.online${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.DATAFAST_API_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro Datafast', detail: err.message });
  }
}
