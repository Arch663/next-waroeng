import type { NextApiRequest, NextApiResponse } from 'next';
import serverless from 'serverless-http';
import dotenv from 'dotenv';
import { app } from '../../server/app';
import { connectDB } from '../../server/config/database';

dotenv.config();

const handler = serverless(app);

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();
  await handler(req, res);
}
