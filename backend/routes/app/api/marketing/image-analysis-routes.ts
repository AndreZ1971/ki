// backend/routes/app/api/marketing/image-analysis-routes.ts
// API-Route für Bildanalyse, Tagging, Qualitätsprüfung, Bild-SEO
import { FastifyInstance } from 'fastify';
// import multer from 'fastify-multer'; // Bildanalyse-Route ist deaktiviert
// import path from 'path';
// import { analyzeImage } from 'c:/Entwicklung/neuer-git-ordner/ki/backend/agent/jobs/image-analysis';

// const upload = multer({ dest: path.join(__dirname, '../../../../uploads/') });

export default async function imageAnalysisRoutes(fastify: FastifyInstance) {
  fastify.register(require('fastify-multer').contentParser);

  // Bildanalyse-Route ist aktuell deaktiviert und wird demnächst bereitgestellt
  // fastify.post('/api/marketing/image/analyze', { preHandler: upload.single('image') }, async (request, reply) => {
  //   // @ts-expect-error Fastify-Multer Typen sind inkompatibel mit Fastify-Request
  //   const file = request.file;
  //   if (!file) {
  //     return reply.status(400).send({ error: 'No image uploaded' });
  //   }
  //   try {
  //     const result = await analyzeImage(file.path);
  //     // Optional: Bild nach Analyse löschen
  //     fs.unlink(file.path, () => {});
  //     return reply.send(result);
  //   } catch (error) {
  //     return reply.status(500).send({ error: error instanceof Error ? error.message : 'Image analysis failed' });
  //   }
  // });
}
