const express = require("express");

const app = express();
app.use(express.json());

const users = [
    { id: 1, username: "perfect admin", password: "admin123", role: "Admin" },
    { id: 2, username: "incredible user", password: "user123", role: "User" }
];

let items = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" }
];

function authenticateBasic(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return res.status(401).json({ message: "Access Denied" });
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8").split(":");
    const [username, password] = credentials;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    req.user = user;
    next();
}

function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
}

app.get("/items", authenticateBasic, (req, res) => {
    res.json(items);
});

app.post("/items", authenticateBasic, authorizeRole("Admin"), (req, res) => {
    const newItem = { id: items.length + 1, name: req.body.name };
    items.push(newItem);
    res.status(201).json(newItem);
});

app.patch("/items/:id", authenticateBasic, authorizeRole("Admin"), (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.name = req.body.name || item.name;
    res.json(item);
});

app.delete("/items/:id", authenticateBasic, authorizeRole("Admin"), (req, res) => {
    items = items.filter(i => i.id !== parseInt(req.params.id));
    res.status(204).send();
});

app.listen(3000, () => console.log("Server running on port 3000"));
