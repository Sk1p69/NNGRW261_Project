 document.addEventListener('DOMContentLoaded', function () {
    const submitBTn = document.getElementById('submitBTN');

    submitBTn.addEventListener('click', function (event) {
      event.preventDefault(); //Die voorkom dat die page gereload word en die nav items verdwyn

      
      const protectedLinks = document.querySelectorAll('.protected');

      //die stel die inline style van die twee a-tags na block om sigbaar te word
      protectedLinks.forEach(link => {
        link.style.display = 'block';
      });

      alert("U is gerigistreer!");
    });
  });