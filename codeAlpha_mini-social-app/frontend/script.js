const API = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {

  const postsDiv = document.getElementById("posts");
  const contentBox = document.getElementById("content");
  const charCount = document.getElementById("charCount");

  /* =========================
     UI HELPERS
  ========================= */
  function showMessage(msg, type = "green") {
    const m = document.getElementById("message");
    m.innerText = msg;
    m.className = `alert ${type}`;
  }

  function notify(msg) {
    const n = document.getElementById("notification");
    n.innerText = msg;
    n.style.display = "block";
    setTimeout(() => n.style.display = "none", 3000);
  }

  /* =========================
     REGISTER
  ========================= */
  window.register = function () {
    fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.userId) {
          userId.value = data.userId;
          currentUser.innerText = `👤 ${username.value}`;
          showMessage("Registered successfully");
        } else {
          showMessage("Registration failed", "red");
        }
      });
  };

  /* =========================
     CREATE POST
  ========================= */
  window.createPost = function () {
    if (!userId.value || !contentBox.value) {
      notify("Login & write something first!");
      return;
    }

    fetch(`${API}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: Number(userId.value),
        content: contentBox.value
      })
    }).then(() => {
      contentBox.value = "";
      charCount.innerText = "0 / 280";
      notify("Post created!");
      loadPosts();
    });
  };

  /* =========================
     LIKE
  ========================= */
  window.likePost = function (id) {
    fetch(`${API}/like/${id}`, { method: "POST" })
      .then(() => loadPosts());
  };

  /* =========================
     COMMENTS
  ========================= */
  window.showCommentBox = function (id) {
    document.getElementById(`comments-${id}`).innerHTML = `
      <input id="c-${id}" placeholder="Write comment">
      <button onclick="addComment(${id})">Post</button>
    `;
  };

  window.addComment = function (id) {
    const text = document.getElementById(`c-${id}`).value;
    if (!text) return;

    fetch(`${API}/comment/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    }).then(() => loadPosts());
  };

  /* =========================
     EDIT & DELETE
  ========================= */
  window.deletePost = function (id) {
    fetch(`${API}/posts/${id}`, { method: "DELETE" })
      .then(() => loadPosts());
  };

  window.editPost = function (id) {
    const newText = prompt("Edit your post:");
    if (!newText) return;

    fetch(`${API}/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newText })
    }).then(() => loadPosts());
  };

  /* =========================
     LOAD POSTS (FEATURES SHOW HERE)
  ========================= */
  function loadPosts() {
    fetch(`${API}/posts`)
      .then(res => res.json())
      .then(posts => {
        postsDiv.innerHTML = "";

        posts.forEach(p => {
          postsDiv.innerHTML += `
            <div class="post">
              <img src="https://i.pravatar.cc/40?u=${p.user_id}">
              <div>
                <b>${p.username}</b><br>
                <small>${p.created_at ? new Date(p.created_at).toLocaleString() : ""}</small>

                <p>${p.content}</p>

                <div class="actions">
                  <button onclick="likePost(${p.id})">❤️ ${p.likes || 0}</button>
                  <button onclick="editPost(${p.id})">✏ Edit</button>
                  <button onclick="deletePost(${p.id})">🗑 Delete</button>
                  <button onclick="showCommentBox(${p.id})">💬 Comment</button>
                </div>

                <div id="comments-${p.id}"></div>
              </div>
            </div>
          `;
        });
      });
  }

  /* =========================
     CHARACTER COUNTER
  ========================= */
  contentBox.addEventListener("input", () => {
    charCount.innerText = contentBox.value.length + " / 280";
  });

  /* INIT */
  loadPosts();
});
