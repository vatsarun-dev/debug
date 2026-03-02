const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const balance = $("#total-balance");
const income = $("#total-income");
const expense = $("#total-expense");
const list = $("#transaction-list");
const form = $("#transaction-form");
const text = $("#text");
const amount = $("#amount");
const category = $("#category");
const modal = $("#modalOverlay");
const openModalBtn = $("#openModal");
const closeModalBtn = $("#closeModal");
const searchInput = $("#search-input");
const filterBtns = $$(".filter-btn");
const typeBtns = $$(".type-btn");

const categoryIcons = {
  salary: "💰",
  food: "🍔",
  entertainment: "🎬",
  shopping: "🛍️",
  utilities: "⚡",
  other: "📦"
};

function loadTransactions() {
  try {
    const raw = localStorage.getItem("transactions");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let transactions = loadTransactions();
let currentFilter = "all";
let selectedType = "income";

function addTransaction(e) {
  e.preventDefault();

  const description = text.value.trim();
  const amountValue = Number(amount.value);
  const type = selectedType;
  const selectedCategory = category.value;

  if (!description || Number.isNaN(amountValue) || amountValue <= 0) {
    return;
  }

  const signedAmount = type === "expense" ? -Math.abs(amountValue) : Math.abs(amountValue);

  const transaction = {
    id: Date.now(),
    text: description,
    amount: signedAmount,
    type,
    category: selectedCategory,
    date: new Date().toLocaleDateString()
  };

  transactions.push(transaction);
  updateLocalStorage();
  init();

  form.reset();
  selectedType = "income";
  typeBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.type === "income"));
  modal.classList.remove("active");
}

function removeTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  updateLocalStorage();
  init();
}

function updateLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function updateValues() {
  const amounts = transactions.map((t) => Number(t.amount) || 0);
  const total = amounts.reduce((acc, val) => acc + val, 0);
  const inc = amounts.filter((val) => val > 0).reduce((acc, val) => acc + val, 0);
  const exp = amounts.filter((val) => val < 0).reduce((acc, val) => acc + val, 0);

  balance.innerText = `$${total.toFixed(2)}`;
  income.innerText = `$${inc.toFixed(2)}`;
  expense.innerText = `$${Math.abs(exp).toFixed(2)}`;
}

function getFilteredTransactions() {
  let filtered = [...transactions];
  const query = searchInput.value.trim().toLowerCase();

  if (query) {
    filtered = filtered.filter((t) => t.text.toLowerCase().includes(query));
  }

  if (currentFilter !== "all") {
    filtered = filtered.filter((t) => t.type === currentFilter);
  }

  return filtered;
}

function renderTransactions() {
  list.innerHTML = "";
  const filtered = getFilteredTransactions();

  if (!filtered.length) {
    list.innerHTML = "<li class='empty-state'>No transactions found.</li>";
    return;
  }

  filtered.forEach((transaction) => {
    const sign = transaction.amount < 0 ? "-" : "+";
    const itemClass = transaction.amount < 0 ? "amount-expense" : "amount-income";
    const item = document.createElement("li");

    item.classList.add("transaction-item");
    item.innerHTML = `
      <div class="item-icon">${categoryIcons[transaction.category] || "📦"}</div>
      <div class="item-details">
        <p>${transaction.text}</p>
        <span>${transaction.date}</span>
      </div>
      <div class="item-amount ${itemClass}">
        ${sign}$${Math.abs(transaction.amount).toFixed(2)}
      </div>
      <button class="delete-btn" data-id="${transaction.id}" type="button">🗑️</button>
    `;

    list.appendChild(item);
  });
}

function init() {
  renderTransactions();
  updateValues();
}

form.addEventListener("submit", addTransaction);
openModalBtn.addEventListener("click", () => modal.classList.add("active"));
closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});

searchInput.addEventListener("input", renderTransactions);

filterBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTransactions();
  });
});

typeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedType = btn.dataset.type;
    typeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

list.addEventListener("click", (e) => {
  const target = e.target.closest(".delete-btn");
  if (!target) {
    return;
  }

  removeTransaction(Number(target.dataset.id));
});

init();
