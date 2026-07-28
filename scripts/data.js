 
 // sit the actionlistener op alle buttons om te kyk of dit geclick word.
 //indien dit geclick word dan sal die page refresh en opdateer.
  const buttons = document.querySelectorAll('button');

  buttons.forEach(button => {

    button.addEventListener('click', function() {

      location.reload(); // refresh die page sodat dit kan opdateer

    });

  });
 
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
 // die hanteer die byvoeging van alle inkomste
  document.getElementById('inkForm').addEventListener('submit', function (e) {
    e.preventDefault();

    //hier kry ons elke waarde apart van die document
    const datum = document.getElementById('inkDatum').value;
    const beskrywing = document.getElementById('inkBeskrywing').value;
    const kategorie = document.getElementById('inkKategorie').value;
    const bedrag = document.getElementById('inkBedrag').value;

    // hier stoor ons die waardes in n string om makliker te manipuleer 
    const nuweInkomste = `${datum}|${beskrywing}|${kategorie}|${bedrag}`;

    // hier kry ons die string van die localstorage anders gee ons n dit leeg terug
    let inkomsteString = localStorage.getItem('inkomsteLys') || '';

    // so elke nuwe byvoeging word na die delimiter bygevoeg en kan later gebruik word om transaksie te kry
    inkomsteString += nuweInkomste + ';';

    // hier stoor ons die appended string na die localstorage toe
    localStorage.setItem('inkomsteLys', inkomsteString);

    // die reset die form sodat ons nog n transaksie kan byvoeg
    this.reset();

    //die was gebruik om te kyk datd ie waardes wel gestoor word
    console.log('Inkomste gestoor:', nuweInkomste);
  });



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



  document.getElementById('uitForm').addEventListener('submit', function (e) {
    e.preventDefault();

    //hier kry ons elke waarde apart van die document
    const datum = document.getElementById('uitDatum').value;
    const beskrywing = document.getElementById('uitBeskrywing').value;
    const kategorie = document.getElementById('uitKategorie').value;
    const bedrag = document.getElementById('uitBedrag').value;

    // hier stoor ons die waardes in n string om makliker te manipuleer
    const nuweUitgawe = `${datum}|${beskrywing}|${kategorie}|${bedrag}`;

    // hier kry ons die string van die localstorage anders gee ons n dit leeg terug
    let uitgawesString = localStorage.getItem('uitgawesLys') || '';

    // so elke nuwe byvoeging word na die delimiter bygevoeg en kan later gebruik word om transaksie te kry
    uitgawesString += nuweUitgawe + ';';

    // hier stoor ons die appended string na die localstorage toe
    localStorage.setItem('uitgawesLys', uitgawesString);

    // die reset die form sodat ons nog n transaksie kan byvoeg
    this.reset();

    //die was gebruik om te kyk datd ie waardes wel gestoor word
    console.log('Uitgawe gestoor:', nuweUitgawe);
  });

  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Die laai die transaksie tabel en voeg al die inkomste en uitgawes in
  function laaiAlleTransaksies() {
    
    //hier kry ons die tabel waar transaksies in gevoeg gaan word
    const tableBody = document.querySelector("table tbody");
    tableBody.innerHTML = '';

    // hierdie funksie laai ons een lys op n slag om die transakseis te split en dan een vir een in die tabel in te voeg
    function voegRyeBy(storageKey) {
    
      const dataString = localStorage.getItem(storageKey);
      //hier kyk ons of die string leeg is en return
      if (!dataString) return;
    
      //anders breek ons die string op by die delimiter
      const items = dataString.split(';').filter(Boolean);

      //dan vir elke transaksie voeg ons dit ry vir ry in
      items.forEach((entry, index) => {
        const [datum, beskrywing, kategorie, bedrag] = entry.split('|');

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${datum}</td>
          <td>${beskrywing}</td>
          <td>${kategorie}</td>
          <td>R ${bedrag}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="verwyderTransaksie('${storageKey}', ${index})">
              Verwyder
            </button>
          </td>
        `;
        //hier voeg ons die nuwe ry in die tabel se body in
        tableBody.appendChild(row);
      });
    }

    // hier voeg ons nou die inkomste en uitgawes in die tabel
    voegRyeBy('inkomsteLys');
    voegRyeBy('uitgawesLys');
  }

  // hier verwyder ons n transasksie wat ons wil verander of verwyder omndat die gebruiker fout gemaak het
  function verwyderTransaksie(storageKey, index, reloadFunction) {

  const dataString = localStorage.getItem(storageKey);
  //weereens ons maak seker die string is nie leeg nie
  if (!dataString) return;

  //anders breek ons die string op by die delimiter
  let items = dataString.split(';').filter(Boolean);
  //hier verwyder ons die ry van data
  items.splice(index, 1);

  //hier herskryf ons die string en gaan stoor dit weer
  const newData = items.join(';') + (items.length > 0 ? ';' : '');
  localStorage.setItem(storageKey, newData);

  if (typeof reloadFunction === 'function') {
    reloadFunction();
  }
}

  // die metode hardloop wanneer die bladsy oopgemaak word
  document.addEventListener('DOMContentLoaded', laaiAlleTransaksies);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //die voer die doel in 
  document.getElementById('DoelForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const sleutel = document.getElementById('doelSleutel').value;
    const teiken = document.getElementById('doelTeikein').value;
    const gespaar = document.getElementById('doelGespaar').value;

    // hier stoor ons die waardes in n string om makliker te manipuleer
    const doelData = `${sleutel}|${teiken}|${gespaar}`;

    // hier kry ons die string van die localstorage anders gee ons n dit leeg terug
    let bestaandeDoele = localStorage.getItem('doelLys') || '';

     // so elke nuwe byvoeging word na die delimiter bygevoeg en kan later gebruik word om transaksie te kry
    bestaandeDoele += doelData + ';';

     // hier stoor ons die appended string na die localstorage toe
    localStorage.setItem('doelLys', bestaandeDoele);

    // die reset die form sodat ons nog n transaksie kan byvoeg
    this.reset();

    // die herlaai die tabel sodat dit die nuwe waardes byvoeg
    laaiDoelTabel();
  });

  // die funksie laai en voeg die nuwe rye in die tabel
  function laaiDoelTabel() {
  //die kry die tbody waar die rye ingevoeg word
  const tbody = document.getElementById('doelTabelBody');
  tbody.innerHTML = '';

  const doelString = localStorage.getItem('doelLys');
  //hier kyk ons of die string leeg is en return
  if (!doelString) return;

  const doele = doelString.split(';').filter(Boolean);

  //funksie voeg elke doel apart in en sit dit by die tabel
  doele.forEach((entry, index) => {

    const [sleutel, teiken, gespaar] = entry.split('|');
    const doelName = vertaalSleutel(sleutel);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${doelName}</td>
      <td>R ${teiken}</td>
      <td>R ${gespaar}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="verwyderTransaksie('doelLys', ${index}, laaiDoelTabel)">
          Verwyder
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}


  // Die vertaal die kategorie na n meer leesbare manier
  function vertaalSleutel(key) {
    switch (key) {
      case 'noodFonds': return 'Noodfonds';
      case 'vakansie': return 'Vakansie';
      case 'karDeposito': return 'Kar Deposito';
      case 'anderDoel': return 'Ander';
      default: return key;
    }
  }

  // die metode hardloop wanneer die bladsy oopgemaak word
  document.addEventListener('DOMContentLoaded', laaiDoelTabel);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //die voer die geprojekteerde ink en uit in
  document.getElementById('projekForm').addEventListener('submit', function(e) {
    e.preventDefault();

    //kry elke waarde
    const maand = document.getElementById('projekMaand').value;
    const inkomste = document.getElementById('projekInk').value;
    const uitgawe = document.getElementById('projekUit').value;

    //stoor die waardes in die volgorde
    const projeksieData = `${maand}|${inkomste}|${uitgawe}`;

    //voeg elke projeksie agter mekaar in
    let bestaandeProjeksies = localStorage.getItem('projeksieLys') || '';

    bestaandeProjeksies += projeksieData + ';';

    //die stoor die projeksies
    localStorage.setItem('projeksieLys', bestaandeProjeksies);

    this.reset();
    laaiProjeksieTabel();
  });

  // die voeg die tabelrye in
  function laaiProjeksieTabel() {
  const tbody = document.getElementById('projekTabelBody');
  tbody.innerHTML = '';

  const dataString = localStorage.getItem('projeksieLys');

  //weereens kyk of die string leeg is
  if (!dataString) return;

  const entries = dataString.split(';').filter(Boolean);

 //funksie voeg elke projeksie apart in en sit dit by die tabel
  entries.forEach((entry, index) => {
    const [maand, inkomste, uitgawe] = entry.split('|');
    const balans = parseFloat(inkomste) - parseFloat(uitgawe);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${maand}</td>
      <td>R ${inkomste}</td>
      <td>R ${uitgawe}</td>
      <td>R ${balans.toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="verwyderTransaksie('projeksieLys', ${index}, laaiProjeksieTabel)">
          Verwyder
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}


  // die metode hardloop wanneer die bladsy oopgemaak word
  document.addEventListener('DOMContentLoaded', laaiProjeksieTabel);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

