import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { app } from './src/app.js';

dotenv.config({ path: './config/.env' });

const port = process.env.PORT || 3000;

mongoose
  .connect(
    'mongodb+srv://seob:jzMhgv91ByD3xTpZ@techmate.qp6i8fm.mongodb.net/techmate'
  )
  .then(() => {
    console.log(
      'mongodb+srv://seob:jzMhgv91ByD3xTpZ@techmate.qp6i8fm.mongodb.net/techmate'
    );
  });

app.listen(port, () => {
  console.log(`localhost:${port} connected!`);
});
