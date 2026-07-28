document.addEventListener('DOMContentLoaded', function(e){

    //skep totaal vairable
    let totaalInk, totaaluit;


    //bereken die totale inkomste en dan voeg dit by in die tabel ry om te display
    totaalInk = bereken('inkomsteLys');
    const tableRowInk = document.getElementById('inkTotaal');
    tableRowInk.textContent = 'R' + totaalInk;

    //bereken die totale uitgawe en dan voeg dit by in die tabel ry om te display
    totaaluit = bereken('uitgawesLys');
    const tableRowUit = document.getElementById('uitTotaal');
    tableRowUit.textContent = 'R' + totaaluit;

    //bereken die netto waarde en dan voeg dit by in die p-elemnt om te display
    let nettoWaarde = totaalInk - totaaluit;
    const nettoP = document.getElementById('nettoWaarde')
    nettoP.textContent = "R" + nettoWaarde;

    //bereken persentasie van ink wat gebruik was in die maand
    let persentasieInk = totaaluit / totaalInk * 100;
    const persentInk = document.getElementById('persentInkGebruik')
    persentInk.textContent = persentasieInk +" % van inkomste gebruik";

    const spanColor = document.getElementById('spanColor');

    //die if bepaal die kleur van n span om n idee te gee of die gebruiker nog binne beperke of moet bekommer
    if (persentasieInk < 50) 
    {
        spanColor.classList.toggle('green');
    }
    else if (persentasieInk > 50 && persentasieInk < 75)
    {
        spanColor.classList.toggle('yellow');
    }
    else
    {
        spanColor.classList.toggle('red');
    }




    //die funksie bereken die totale
    function bereken(storageKey) {
    
      //kry die string wat transaksie behou en skep variable om dit mee uit te werk
      const dataString = localStorage.getItem(storageKey);
      let total = 0;
    
      //indien dit leeg is dan return ons net
      if (!dataString) return;
    
      //anders breek ons die string op by die delimiter
      const items = dataString.split(';').filter(Boolean);

      
      items.forEach((entry) => {

        const [datum, beskrywing, kategorie, bedrag] = entry.split('|');

        //plus die bedrae bymekaar sodat die totaal bereken word
        total += parseFloat(bedrag);
        console.log(total);
      });
     return total;
    }


    
    //hier kry ons die tabel waar transaksies in gevoeg gaan word
    const tableBody = document.getElementById('transaksieTab');
    tableBody.innerHTML = '';

    // hierdie funksie laai ons een lys op n slag om die transakseis te split en dan een vir een in die tabel in te voeg
    function voegRyeBy(storageKey) {
    
      const dataString = localStorage.getItem(storageKey);
      //hier kyk ons of die string leeg is en return
      if (!dataString) return;
    
      //anders breek ons die string op by die delimiter
      const items = dataString.split(';').filter(Boolean);

            const [datum, beskrywing, kategorie, bedrag] = items[items.length-1].split('|');
            
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${datum}</td>
            <td>${beskrywing}</td>
            <td>${kategorie}</td>
            <td>R ${bedrag}</td>
            `;
            //hier voeg ons die nuwe ry in die tabel se body in
            tableBody.appendChild(row);
        
    }

    // hier voeg ons nou die inkomste en uitgawes in die tabel
    voegRyeBy('inkomsteLys');
    voegRyeBy('uitgawesLys');
  
    
  //die kry die tbody waar die rye ingevoeg word
  const tbody = document.getElementById('doelTabelBody');
  tbody.innerHTML = '';

  const doelString = localStorage.getItem('doelLys');
  //hier kyk ons of die string leeg is en return
  if (!doelString) return;

  const doele = doelString.split(';').filter(Boolean);

  //funksie voeg elke doel apart in en sit dit by die tabel
  doele.forEach((entry) => {

    const [sleutel, teiken, gespaar] = entry.split('|');
    const doelName = vertaalSleutel(sleutel);
    let vordering = gespaar / teiken * 100;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${doelName}</td>
      <td>R ${teiken}</td>
      <td>R ${gespaar}</td>
      <td> ${vordering} % </td>
    `;
    tbody.appendChild(row);
  });


  function vertaalSleutel(key) {
    switch (key) {
      case 'noodFonds': return 'Noodfonds';
      case 'vakansie': return 'Vakansie';
      case 'karDeposito': return 'Kar Deposito';
      case 'anderDoel': return 'Ander';
      default: return key;
    }
  }

  //kry die tabel waar die projelsies bygevoeg word
  const projekTab = document.getElementById('projekTabelBody');
  projekTab.innerHTML = '';

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
    `;

    projekTab.appendChild(row);
  });

  }
); 
