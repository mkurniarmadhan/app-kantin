$(document).ready(function () {
  let items = []; // Menyimpan daftar barang
  let categories = []; // Daftar kategori unik
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  let isAdmin = false;

  // Mengambil daftar produk dari API dan menampilkannya
  async function loadBarang(filter = "all") {
    const response = await fetch("http://localhost:3000/api/barang");
    const barang = await response.json();
    items = barang;
    categories = [...new Set(barang.map((item) => item.category))]; // Ambil kategori unik

    renderKategori();
    renderBarang();
  }

  function renderBarang(filter = "all") {
    const itemList = $("#listBarang");
    itemList.empty();
    const filteredItems =
      filter === "all"
        ? items
        : items.filter((item) => item.category === filter);

    if (filteredItems.length === 0) {
      itemList.append(
        `<div class="col-12 text-center">Produk tidak ditemukan untuk kategori ini.</div>`
      );
      return;
    }
    filteredItems.forEach((item, index) => {
      itemList.append(`
          <div class="col">
            <div class="card shadow-sm">
              <svg class="bd-placeholder-img card-img-top" width="100%" height="225" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Thumbnail" preserveAspectRatio="xMidYMid slice" focusable="false">
                <rect width="100%" height="100%" fill="#55595c" />
                <text x="50%" y="50%" fill="#eceeef" dy=".3em">${item.name}</text>
              </svg>
              <div class="card-body">
                <p class="card-text">Rp. ${item.price}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <button type="button" class="btn btn-sm btn-outline-secondary addToCart" data-index="${index}">Tambah Keranjang</button>
                </div>
              </div>
            </div>
          </div>`);
    });
  }
  function renderKategori() {
    const categoryList = $("#listkategori");
    categoryList.empty();
    categoryList.append(`
        
         <div class="form-check form-check-inline mb-3">
             <input type="radio" class="btn-check filterCategory" id="category-all" name="category" data-category="all" autocomplete="off">
        <label class="btn btn-outline-primary" for="category-all">semua</label><br></div>
       
    `);
    categories.forEach((category, index) => {
      categoryList.append(`
            <div class="form-check form-check-inline mb-3">
      <input type="radio" class="btn-check filterCategory" id="category-${index}" name="category" data-category="${category}" autocomplete="off">
        <label class="btn btn-outline-primary" for="category-${index}">${category}</label><br> </div>
  `);
    });
  }

  // PIlih barang berdasarkan kategori
  $(document).on("change", "input[name='category']", function () {
    const selectedCategory = $(this).data("category");
    renderBarang(selectedCategory);
  });

  // Mengambil daftar pemesanan dari API dan menampilkannya
  async function loadOrders() {
    const response = await fetch("http://localhost:3000/api/orders");
    const orders = await response.json();
    const orderTable = document.getElementById("orderTable");

    orders.forEach((order) => {
      const row = document.createElement("tr");
      const barang = order.barang.join(", ");
      row.innerHTML = `<td>${order.tanggal}</td><td>${barang}</td><td>${order.total}</td><td>${order.metode}</td>`;
      orderTable.appendChild(row);
    });
  }

  // Menambahkan produk baru
  async function addProduct(event) {
    event.preventDefault();

    const name = document.getElementById("productName").value;
    const price = document.getElementById("productPrice").value;
    const description = document.getElementById("productDescription").value;

    const response = await fetch("http://localhost:3000/api/barang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, description }),
    });

    const result = await response.json();
    alert(result.message);
    loadbarang(); // Refresh the product list
  }

  // Menambahkan pemesanan baru
  async function addOrder(event) {
    event.preventDefault();

    const tanggal = document.getElementById("orderTanggal").value;
    const barang = document.getElementById("orderbarang").value.split(","); // Misalnya, ID produk dipisahkan koma
    const total = document.getElementById("orderTotal").value;
    const metode = document.getElementById("orderMetode").value;

    const response = await fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanggal, barang, total, metode }),
    });

    const result = await response.json();
    alert(result.message);
    loadOrders(); // Refresh the order list
  }
  // Tambahkan barang ke keranjang
  $(document).on("click", ".addToCart", function () {
    const index = $(this).data("index");
    const selectedItem = items[index];
    const existingItem = cart.find((item) => item.name === selectedItem.name);

    if (existingItem) {
      existingItem.qty++;
    } else {
      cart.push({ ...selectedItem, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  });

  // Fungsi render keranjang
  function renderCart() {
    $(".totalKeranjang").text(cart.length);
    const cartItems = $("#cartItems");
    cartItems.empty();

    if (cart.length === 0) {
      cartItems.append(
        `<li class="list-group-item text-center">Keranjang masih kosong. <a href="/">Pilih Produk</a></li>`
      );
      return;
    }

    let total = 0;
    cart.forEach((item, index) => {
      const subtotal = item.qty * item.price;
      total += subtotal;

      cartItems.append(`
          <li class="list-group-item d-flex justify-content-between">
            <div>
              <h6>${item.name}</h6>
              <small>${item.price} x ${item.qty} = Rp ${subtotal}</small>
            </div>
            <button style="    height: fit-content;" class="btn btn-sm btn-danger  removeItem" data-index="${index}">x</button>
          </li>`);
    });

    cartItems.append(
      `<li class="list-group-item d-flex justify-content-between"><strong>Total</strong>Rp. ${total}</li>`
    );
  }
  // Hapus barang dari keranjang
  $(document).on("click", ".removeItem", function () {
    const index = $(this).data("index");
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  });

  window.onload = function () {
    loadBarang();
    renderCart();
    // loadOrders();
  };
});
