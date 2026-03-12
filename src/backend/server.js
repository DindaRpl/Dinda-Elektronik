const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

//API LOGIN
app.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM users WHERE username=$1 AND password=$2",
        [username, password]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ message: "Login gagal" });
    }

    const token = jwt.sign(
        {id: result.rows[0].id },
        "SECRET_KEY",
        { expiresIn: "1h" }
    );

    res.json({
        message: "Login berhasil",
        token: token,
    });
});

app.listen(5000, () => {
    console.log("Server jalan di http://localhost:3000");
});