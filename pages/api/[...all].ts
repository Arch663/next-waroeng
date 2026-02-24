import type { NextApiRequest, NextApiResponse } from 'next';
import { app } from '../../server/app';
import { connectDB } from '../../server/config/database';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  await new Promise<void>((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('error', reject);

    const expressApp = app as unknown as (
      req: NextApiRequest,
      res: NextApiResponse,
      next: (err?: unknown) => void
    ) => void;

    expressApp(req, res, (err?: unknown) => {
      if (err) reject(err);
    });
  });
}

