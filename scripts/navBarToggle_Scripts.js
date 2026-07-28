document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.getElementById('mainNavbar');
    const navbarToggler = document.querySelector('.navbar-toggler');
    navbarToggler.addEventListener('click', function () {
      navbar.classList.toggle('active');
    });
  });
  // Die volgende script kyk deur actionListener of die user die navbar-toggler click aka die hamburger
  // As die user dit click dan add dit n class 'active'
  // Dit word gebruik om die navbar op kleiner resolusies te verander as die user op dit click