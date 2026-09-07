export default function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    service: 'property-intel-orchestrator',
    timestamp: new Date().toISOString(),
  });
}