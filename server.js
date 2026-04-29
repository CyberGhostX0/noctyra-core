const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        status: "Echo is alive",
        time: new Date()
    });
});

app.post('/echo', (req, res) => {
    const userInput = req.body.message;

    res.json({
        reply: "Echo heard: " + userInput
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Echo running on port ${PORT}`);
});
