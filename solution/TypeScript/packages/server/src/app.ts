import express from 'express';
import { demoRouter } from './middleware/demo.js';
import { configureRouter } from './middleware/configure.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/demo', demoRouter);
app.use('/configure', configureRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
