(() => {
  const mount = document.getElementById("batch41-header");
  if (!mount) {
    console.error("Không tìm thấy vùng hiển thị header Batch 41.");
    return;
  }

  const links = [
    { href: "./index.html", label: "Tính trả góp", mobileLabel: "📊 Tính trả góp" },
    { href: "./target.html", label: "Tổng quan chỉ tiêu", mobileLabel: "📈 Tổng quan chỉ tiêu" },
    { href: "./customers.html", label: "Danh sách khách hàng", mobileLabel: "👥 Danh sách khách hàng" },
    { href: "./customer_search.html", label: "Tìm khách hàng", mobileLabel: "🔎 Tìm khách hàng" },
    { href: "./employee_schedule.html", label: "Tìm lịch làm việc", mobileLabel: "📅 Tìm lịch làm việc" },
    { href: "./bonus.html", label: "Thưởng SI", mobileLabel: "🎁 Thưởng SI" },
    { href: "./convert_address.html", label: "Chuyển đổi địa chỉ", mobileLabel: "🔄 Chuyển đổi địa chỉ" },
  ];

  const currentPage = window.location.pathname.split("/").pop();
  const renderLink = ({ href, label, mobileLabel }) => {
    const isCurrentPage = href.endsWith(currentPage);
    const currentAttribute = isCurrentPage ? ' aria-current="page"' : "";

    return {
      desktop: `<a href="${href}"${currentAttribute}>${label}</a>`,
      mobile: `<a class="btn btn-light w-100 mb-2" href="${href}"${currentAttribute}>${mobileLabel}</a>`,
    };
  };
  const renderedLinks = links.map(renderLink);

  mount.innerHTML = `
    <header class="b41-header">
      <a class="logo" href="./index.html" aria-label="Batch 41 - Trang chủ">🚗 Batch 41</a>
      <nav class="desktop-nav" aria-label="Điều hướng chính">
        ${renderedLinks.map((link) => link.desktop).join("")}
        <a href="#logout" onclick="window.batch41Logout(); return false;">Đăng xuất</a>
      </nav>
      <button
        type="button"
        class="btn btn-outline-primary d-md-none"
        data-bs-toggle="offcanvas"
        data-bs-target="#mobileMenu"
        aria-controls="mobileMenu"
        aria-expanded="false"
        aria-label="Mở menu điều hướng"
      >☰</button>
    </header>
    <div class="offcanvas offcanvas-end" tabindex="-1" id="mobileMenu" aria-labelledby="mobileMenuLabel">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="mobileMenuLabel">🚗 Batch 41</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Đóng menu"></button>
      </div>
      <nav class="offcanvas-body" aria-label="Điều hướng di động">
        ${renderedLinks.map((link) => link.mobile).join("")}
        <hr />
        <button class="btn btn-danger w-100" type="button" onclick="window.batch41Logout()">🔐 Đăng xuất</button>
      </nav>
    </div>
  `;

  window.batch41Logout = () => {
    if (typeof window.logout === "function") {
      return window.logout();
    }

    sessionStorage.removeItem("logged");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.assign("./index.html");
  };
})();
