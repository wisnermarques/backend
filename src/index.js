const express = require('express');
const cors = require('cors');

const app = express();

//config json response
app.use(express.json());

//Solve cors
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

//routes
const ClienteRoutes = require('./routes/ClienteRoutes');
const EstacionamentoRoutes = require('./routes/EstacionamentoRoutes');
app.use('/clientes', ClienteRoutes);
app.use('/estacionamento', EstacionamentoRoutes);

app.listen(5000, () => {
  console.log('Servidor no ar');
})