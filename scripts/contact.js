document.getElementById('contactForm').addEventListener('submit', function (e) 
{
    //kry kontakvorm se waardes
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    //stoor nuwe kontak vorm in so formaat
    const nuweKontak = `${name}|${email}|${message}`;

    //heg aan die nuwe kontakform
    let kontakString = localStorage.getItem('nuweKontak') || '';

    kontakString += nuweKontak + ';';

    //bere dit in local storage
    localStorage.setItem('nuweKontak', kontakString);

    //reset die page
    this.reset();
}); 