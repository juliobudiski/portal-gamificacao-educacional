import jwt from 'jsonwebtoken'; console.log(jwt.sign({ sub: 1, role: 'professor' }, 'your_secret_key_here', { expiresIn: '1h' }));
