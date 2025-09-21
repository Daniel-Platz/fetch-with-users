window.addEventListener("DOMContentLoaded", initApp);

const BASE_URL = "https://jsonplaceholder.typicode.com";
const USERS_URL = `${BASE_URL}/users`;
let users = [];
let editingUserId = null;
const messages = document.querySelector("#messages");

function showMessage(text, type = "info") {
  messages.textContent = text;
  messages.dataset.type = type;
}

async function initApp() {
  try {
    users = await fetchUsers();
    renderUsers(users);
    showMessage("Users loaded.", "success");
  } catch (error) {
    showMessage("Failed to fetch users.", "error");
    console.error(error);
  }

  document.querySelector("#usersTable").onclick = handleTableClick;
  document.querySelector("#userForm").addEventListener("submit", handleFormSubmit);
}

async function fetchUsers() {
  const resp = await fetch(USERS_URL);
  if (!resp.ok) {
    throw new Error("Fetch users failed");
  }
  return resp.json();
}

function renderUsers(list) {
  const table = document.querySelector("#usersTable");
  table.textContent = "";

  // --- Header row
  const header = document.createElement("tr");
  const firstUser = list[0];
  for (const key in firstUser) {
    const th = document.createElement("th");
    th.textContent = key;
    header.appendChild(th);
  }

  const actionsTh = document.createElement("th");
  actionsTh.textContent = "Actions";
  header.appendChild(actionsTh);

  table.appendChild(header);

  // --- Data rows
  for (const user of list) {
    const row = document.createElement("tr");
    row.dataset.userId = user.id;

    for (const key in user) {
      const td = document.createElement("td");
      const value = user[key];
      if (value && typeof value === "object") {
        td.textContent = JSON.stringify(value);
      } else {
        td.textContent = value;
      }
      row.appendChild(td);
    }

    // --- Add Buttons
    const actions = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.dataset.userId = user.id;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.dataset.userId = user.id;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);

    table.appendChild(row);
  }
}

function handleTableClick(event) {
  const button = event.target;
  const userId = Number(button.dataset.userId);

  if (button.textContent === "Edit") {
    const user = users.find((item) => item.id === userId);
    document.querySelector("#name").value = user.name ?? "";
    document.querySelector("#email").value = user.email ?? "";
    editingUserId = user.id;
    document.querySelector("#userForm button[type='submit']").textContent = "Update";
  } else if (button.textContent === "Delete") {
    handleDelete(userId);
  }
}

async function handleDelete(userId) {
  try {
    const resp = await fetch(`${USERS_URL}/${userId}`, { method: "DELETE" });
    if (!resp.ok) {
      throw new Error("Delete failed");
    }

    users = users.filter((item) => item.id !== userId);
    renderUsers(users);

    if (editingUserId === userId) {
      editingUserId = null;
      document.querySelector("#userForm").reset();
      document.querySelector("#userForm button[type='submit']").textContent = "Add";
    }

    showMessage("User deleted.", "success");
  } catch (error) {
    showMessage("Failed to delete user.", "error");
    console.error(error);
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const nameInput = document.querySelector("#name");
  const emailInput = document.querySelector("#email");

  const newUser = {
    name: nameInput.value,
    email: emailInput.value,
  };

  try {
    if (editingUserId !== null) {
      const resp = await fetch(`${USERS_URL}/${editingUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!resp.ok) {
        throw new Error("Update failed");
      }

      const updatedUser = await resp.json();
      const index = users.findIndex((item) => item.id === editingUserId);
      const template = users[index];
      const mergedUser = {};
      for (const key in template) {
        mergedUser[key] = updatedUser[key] ?? template[key];
      }

      users[index] = mergedUser;
      showMessage("User updated.", "success");
    } else {
      const resp = await fetch(USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!resp.ok) {
        throw new Error("Create failed");
      }

      const createdUser = await resp.json();

      // Clone the first record so name and email show up in the existing columns
      const template = users[0];
      const formattedUser = {};
      for (const key in template) {
        formattedUser[key] = createdUser[key] ?? "";
      }

      users.push(formattedUser);
      showMessage("User created.", "success");
    }

    renderUsers(users);

    event.target.reset();
    editingUserId = null;
    document.querySelector("#userForm button[type='submit']").textContent = "Add";
  } catch (error) {
    showMessage("Failed to submit form.", "error");
    console.error(error);
  }
}
