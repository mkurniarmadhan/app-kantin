$(document).ready(function () {
  let items = []; // Menyimpan daftar barang
  let categories = []; // Daftar kategori unik
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  let isAdmin = false;

  const reset = getQueryParam("reset");

  if (reset == 1) {
    cart = [];
    orderHistory = [];
  }
  // Memuat data barang dari file JSON
  $.getJSON("data-barang.json", function (data) {
    items = data;
    categories = [...new Set(data.map((item) => item.category))]; // Ambil kategori unik
    renderCategories();
    renderItems(); // Tampilkan semua produk saat pertama kali
  });

  // Fungsi untuk render kategori

  function renderCategories() {
    const categoryList = $("#listkategori");
    categoryList.empty();
    categoryList.append(`
      
       <div class="form-check form-check-inline">
           <input type="radio" class="btn-check filterCategory" id="category-all" name="category" data-category="all" autocomplete="off">
      <label class="btn btn-outline-primary" for="category-all">semua</label><br></div>
     
  `);
    categories.forEach((category, index) => {
      categoryList.append(`
          <div class="form-check form-check-inline">
    <input type="radio" class="btn-check filterCategory" id="category-${index}" name="category" data-category="${category}" autocomplete="off">
      <label class="btn btn-outline-primary" for="category-${index}">${category}</label><br> </div>
`);
    });
  }
  // Fungsi render daftar barang
  function renderItems(filter = "all") {
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

  // Hapus barang dari keranjang
  $(document).on("click", ".removeItem", function () {
    const index = $(this).data("index");
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  });

  // Event listener untuk filter kategori
  $(document).on("change", "input[name='category']", function () {
    const selectedCategory = $(this).data("category");
    renderItems(selectedCategory);
  });

  $(document).on("change", "input[name='metode_pembayaran']", function () {
    if ($("#non_tunai").is(":checked")) {
      $("#qrCodeSection").removeClass("d-none");
    } else {
      $("#qrCodeSection").addClass("d-none");
    }
  });

  // Render riwayat pesanan
  function renderOrderHistory() {
    const idPesanan = getQueryParam("id");
    const orderId = getQueryParam("order");

    if (idPesanan) $("#nomor_identitas").val(idPesanan);
    if (idPesanan === "admin") {
      isAdmin = true;
      $("#konfirmasiPesanan").removeClass("d-none");
    }

    const filteredOrders = isAdmin
      ? orderHistory
      : orderHistory.filter((order) => order.nomorIdentitas === idPesanan);

    const riwayatPesanan = $("#riwayatPesanan");
    riwayatPesanan.empty();

    if (filteredOrders.length > 0) {
      filteredOrders.forEach((order) => {
        const { pesanan } = order;
        let total = 0;

        pesanan.forEach((item) => {
          const subtotal = item.qty * item.price;
          total += subtotal;
        });

        riwayatPesanan.append(`
          <tr>
            <td>${order.id}</td>
            <td>${order.nama}</td>
            <td>${total}</td>
            <td>${order.metodePembayaran}</td>
            <td>${order.status ? "Selesai" : "Belum selesai"}</td>
            <td><a href="riwayat.html?id=${idPesanan}&order=${
          order.id
        }" class="btn btn-primary btn-sm">Detail</a></td>
          </tr>`);
      });
    } else {
      riwayatPesanan.append(
        '<tr><td colspan="6" class="text-center">Pesanan tidak ditemukan.</td></tr>'
      );
    }

    if (orderId) {
      $("#container-detail").removeClass("d-none");
      renderOrderDetail(filteredOrders.find((order) => order.id === orderId));
    }
  }

  function kirimPesanWhatsApp(nama, wa, barang, totalBayar, metodeBayar) {
    // Membuat pesan WhatsApp
    let pesan = `Hallo, *${nama}*\n\nPesanan kamu sudah selesai, berikut detail pesanan kamu:\n\n`;

    // Loop untuk barang
    barang.forEach((item) => {
      pesan += `*${item.name}* : ${item.price} x ${item.qty} = ${
        item.price * item.qty
      }\n`;
    });

    pesan += `\n*TOTAL BAYAR* = ${totalBayar}\n*METODE BAYAR* = ${metodeBayar}`;

    wa = wa.replace(/^0/, "62");

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${wa}&text=${encodeURIComponent(
      pesan
    )}`;

    return whatsappUrl;
  }

  function renderOrderDetail(order) {
    const detailPesanan = $("#detailPesanan").removeClass("d-none").empty();
    if (!order) {
      detailPesanan.html("Pesanan tidak ditemukan.").addClass("alert-danger");
      return;
    }

    const { nama, wa, pesanan, metodePembayaran } = order;

    let total = 0;
    pesanan.forEach((item) => {
      const subtotal = item.qty * item.price;
      total += subtotal;
    });

    const pesanWhatsApp = kirimPesanWhatsApp(
      nama,
      wa,
      pesanan,
      total,
      metodePembayaran
    );

    console.log(pesanWhatsApp);

    // return;

    $("#konfirmasiPesanan")
      .attr("href", pesanWhatsApp)
      .attr("target", "_blank"); // Membuka di tab baru

    detailPesanan.html(`
      <strong>ID Pesanan:</strong> ${order.id}<br>
      <strong>Nama:</strong> ${order.nama}<br>
      <strong>WA:</strong> ${order.wa}<br>
      <strong>Status:</strong> ${
        order.status ? "Selesai" : "Belum selesai"
      } <br>
      <strong>Metode Pembayaran:</strong> ${order.metodePembayaran}`);

    renderProduk(order.pesanan);
  }

  function renderProduk(produks) {
    const pesananItems = $("#pesananItems").empty();
    let total = 0;

    produks.forEach((item) => {
      const subtotal = item.qty * item.price;
      total += subtotal;
      pesananItems.append(`
        <li class="list-group-item d-flex justify-content-between">
          <div>
            <h6>${item.name}</h6>
            <small>${item.price} x ${item.qty} = Rp ${subtotal}</small>
          </div>
        </li>`);
    });
    pesananItems.append(
      `<li class="list-group-item d-flex justify-content-between"><strong>Total</strong>Rp. ${total}</li>`
    );
  }

  function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
  }

  $("#buatPesanan").on("submit", function (e) {
    e.preventDefault();

    if (cart.length === 0) return alert("Keranjang kosong!");

    const pesananBaru = {
      id: generateOrderId($("#nomor_identitas").val()),
      nama: $("#nama").val(),
      wa: $("#wa").val(),
      nomorIdentitas: $("#nomor_identitas").val(),
      pesanan: cart,
      metodePembayaran: $('input[name="metode_pembayaran"]:checked').val(),
      status: false,
    };

    orderHistory.push(pesananBaru);
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));

    window.location.href = `riwayat.html?id=${pesananBaru.nomorIdentitas}`;
  });

  function generateOrderId(nomorIdentitas) {
    const filteredOrders = orderHistory.filter(
      (order) => order.nomorIdentitas === nomorIdentitas
    );
    return `trx-${nomorIdentitas.substring(0, 6)}${filteredOrders.length}`;
  }

  renderCart();
  renderOrderHistory();
});
