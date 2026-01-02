const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

/* TEST */
app.get("/api", (req, res) => {
  res.send("Mini Social Media Backend Running");
});

/* REGISTER */
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, password],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Username already exists" });
      }
      res.json({ userId: this.lastID });
    }
  );
});

/* CREATE POST */
app.post("/posts", (req, res) => {
  const { user_id, content } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ message: "Missing data" });
  }

  db.run(
    `INSERT INTO posts (user_id, content) VALUES (?, ?)`,
    [user_id, content],
    () => res.json({ message: "Post created" })
  );
});

app.get("/posts", (req, res) => {
  db.all(
    `SELECT posts.id,
            posts.user_id,
            posts.content,
            posts.created_at,
            users.username,
            (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) AS likes
     FROM posts
     JOIN users ON posts.user_id = users.id
     ORDER BY posts.id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Fetch failed" });
      res.json(rows);
    }
  );
});

app.post("/like/:id", (req, res) => {
  db.run(
    `INSERT INTO likes (post_id) VALUES (?)`,
    [req.params.id],
    () => res.json({ message: "Liked" })
  );
});
app.post("/comment/:id", (req, res) => {
  db.run(
    `INSERT INTO comments (post_id, text) VALUES (?, ?)`,
    [req.params.id, req.body.text],
    () => res.json({ message: "Comment added" })
  );
});
app.delete("/posts/:id", (req, res) => {
  db.run(
    `DELETE FROM posts WHERE id = ?`,
    [req.params.id],
    () => res.json({ message: "Post deleted" })
  );
});
app.put("/posts/:id", (req, res) => {
  db.run(
    `UPDATE posts SET content=? WHERE id=?`,
    [req.body.content, req.params.id],
    () => res.json({ message: "Post updated" })
  );
});


/* START */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
