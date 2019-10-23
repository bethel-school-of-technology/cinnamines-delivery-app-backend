import express from 'express';

const app = express();
app.get('/', (req, res) => res.send('The Back-end Works!!! E\'s CinnaminE\'s Full Stack Web Application here we come!'));
app.listen(4000, () => console.log('Express serving running on port 4000'));