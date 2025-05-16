
// ── Elements ──
const userEmailInput     = document.getElementById("userEmail");
const todoItemsContainer = document.getElementById("todoItemsContainer");
const addTodoButton      = document.getElementById("addTodoButton");
const saveTodoButton     = document.getElementById("saveTodoButton");

// ── Load saved email & tasks ──
userEmailInput.value = localStorage.getItem("userEmail") || "";

function getTodoListFromLocalStorage() {
  const raw = localStorage.getItem("todoList");
  return raw ? JSON.parse(raw) : [];
}

let todoList  = getTodoListFromLocalStorage();
let todosCount = todoList.length;

// ── Save email & tasks ──
userEmailInput.onchange = () => {
  localStorage.setItem("userEmail", userEmailInput.value.trim());
};
saveTodoButton.onclick = () => {
  localStorage.setItem("todoList", JSON.stringify(todoList));
};

// ── Schedule email reminder ──
function scheduleReminder(todo) {
  if (todo._timerId) clearTimeout(todo._timerId);

  const endMs   = new Date(todo.endTime).getTime();
  const sendAt  = endMs - 60 * 60 * 1000; // 1 hour before end
  const now     = Date.now();
  const delay   = sendAt - now;

  if (delay > 0 && !todo._deleted) {
    todo._timerId = setTimeout(() => {
      if (!todo._deleted) {
        const toEmail = userEmailInput.value.trim();
        if (!toEmail) return;

        emailjs.send(
          "service_k1lce5j", // Your EmailJS service ID
          "template_sm3jcul", // Your EmailJS template ID
          {
            to_email: toEmail,
            task_name: todo.text,
            task_end: todo.endTime
          }
        ).then(
          () => alert("Reminder sent for " + todo.text),
          err => {
            console.error("EmailJS error:", err);
            alert("Failed to send reminder for " + todo.text + ". Please try again.");
          }
        );
      }
    }, delay);
  }
}

// ── Render a task ──
function createAndAppendTodo(todo) {
  const { uniqueNo, text, isChecked, startTime, endTime } = todo;
  const todoId     = "todo" + uniqueNo;
  const checkboxId = "checkbox" + uniqueNo;
  const labelId    = "label" + uniqueNo;

  const li = document.createElement("li");
  li.id = todoId;
  li.className = "todo-item-container d-flex flex-column mb-2";
  todoItemsContainer.appendChild(li);

  // top row
  const row = document.createElement("div");
  row.className = "d-flex flex-row align-items-center";
  li.appendChild(row);

  const cb = document.createElement("input");
  cb.type = "checkbox"; cb.id = checkboxId; cb.checked = isChecked;
  cb.className = "checkbox-input me-2";
  row.appendChild(cb);

  const lbl = document.createElement("label");
  lbl.setAttribute("for", checkboxId);
  lbl.id = labelId;
  lbl.className = "checkbox-label";
  lbl.textContent = text;
  if (isChecked) lbl.classList.add("checked");
  row.appendChild(lbl);

  const delCt = document.createElement("div");
  delCt.className = "delete-icon-container ms-auto";
  row.appendChild(delCt);

  const del = document.createElement("i");
  del.className = "far fa-trash-alt delete-icon clickable";
  delCt.appendChild(del);

  // times row
  const times = document.createElement("div");
  times.className = "time-display mt-1";
  times.textContent =
    "Start: " + new Date(startTime).toLocaleString() +
    "  |  End: " + new Date(endTime).toLocaleString();
  li.appendChild(times);

  // events
  cb.onclick = () => {
    lbl.classList.toggle("checked");
    todo.isChecked = cb.checked;
  };

  del.onclick = () => {
    todo._deleted = true;
    clearTimeout(todo._timerId);
    todoList = todoList.filter(t => t.uniqueNo !== uniqueNo);
    li.remove();
  };

  scheduleReminder(todo);
}

// ── Add new task ──
function onAddTodo() {
  const textVal  = document.getElementById("todoUserInput").value.trim();
  const startVal = document.getElementById("todoStartTime").value;
  const endVal   = document.getElementById("todoEndTime").value;

  if (!textVal || !startVal || !endVal) {
    return alert("Please fill in task text, start and end time.");
  }
  if (new Date(endVal) <= new Date(startVal)) {
    return alert("End time must be after start time.");
  }
  if (new Date(endVal) <= new Date(Date.now() + 60 * 60 * 1000)) {
    return alert("End time must be at least one hour from now.");
  }

  todosCount++;
  const newTodo = {
    text:      textVal,
    uniqueNo:  todosCount,
    isChecked: false,
    startTime: startVal,
    endTime:   endVal,
    _deleted:  false,
    _timerId:  null
  };

  todoList.push(newTodo);
  createAndAppendTodo(newTodo);

  // clear form
  document.getElementById("todoUserInput").value  = "";
  document.getElementById("todoStartTime").value = "";
  document.getElementById("todoEndTime").value   = "";
}

addTodoButton.onclick = onAddTodo;

// ── Init existing tasks on page load ──
todoList.forEach(createAndAppendTodo);
