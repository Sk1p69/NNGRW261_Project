 document.addEventListener('DOMContentLoaded', function () {
    //kry die login button
    const loginBtn = document.getElementById('loginBtn');

    loginBtn.addEventListener('click', function (event) {
      event.preventDefault(); //Die voorkom dat die page gereload word en die nav items verdwyn

      const protectedLinks = document.querySelectorAll('.protected');

      //die stel die inline style van die twee a-tags na block om sigbaar te word
      protectedLinks.forEach(link => {
        link.style.display = 'block';
      });

      alert("Aangemeld!");
    });
  });