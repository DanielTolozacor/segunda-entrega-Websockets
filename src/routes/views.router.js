import express from 'express';

const viewsrouter = express.Router();
//endpoint//
viewsrouter.get('/', (req, res) => {
  res.render('index');
});
export default viewsrouter;