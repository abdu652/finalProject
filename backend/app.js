import express, { urlencoded } from 'express';
import dotenv from 'dotenv';
import db from './configure/db.confige.js';
import router from './routes/index.js';
import cors from 'cors';
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors())

app.use(express.json());
app.use('/api',router);
app.get('/',(req,res)=>{
    res.send('Hello World!')
})
app.listen(port,()=>{
    db()
    console.log(`Server is running on port ${port}`)
})