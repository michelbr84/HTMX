const express = require('express');
const app = express();
const path = require('path');

// Servir o arquivo index.html na rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para saudação personalizada
app.get('/greeting', (req, res) => {
  const greetings = [
    'Olá, mundo!',
    'Bonjour, le monde!',
    'Hola, mundo!',
    'Hallo, Welt!',
    'Ciao, mondo!',
    'こんにちは世界',
    'Привет, мир!',
    'مرحبا بالعالم'
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  res.send(`
    <div class="greeting">
      <p>${randomGreeting}</p>
      <p>✨ Saudação especial para você! ✨</p>
    </div>
  `);
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});