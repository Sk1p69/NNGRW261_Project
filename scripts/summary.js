document.addEventListener('DOMContentLoaded', function(e){

    //skep totaal vairable
    let totaalInk, totaaluit;


    //bereken die totale inkomste en dan voeg dit by in die tabel ry om te display
    totaalInk = bereken('inkomsteLys');
    const totalInk = document.getElementById('inkTotaal');
    totalInk.textContent = 'R' + totaalInk;

    //bereken die totale uitgawe en dan voeg dit by in die tabel ry om te display
    totaaluit = bereken('uitgawesLys');
    const totalUit = document.getElementById('uitTotaal');
    totalUit.textContent = 'R' + totaaluit;

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
  let totaleVordering = 0;

  const doelString = localStorage.getItem('doelLys');
  //hier kyk ons of die string leeg is en return
  if (!doelString) return;

  const doele = doelString.split(';').filter(Boolean);

  //funksie voeg elke doel apart in en sit dit by die tabel
  doele.forEach((entry) => {

    const [sleutel, teiken, gespaar] = entry.split('|');
    const doelName = vertaalSleutel(sleutel);
    let vordering = gespaar / teiken * 100;
    totaleVordering += parseFloat(gespaar);

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

    const totalVorder = document.getElementById('vordering');
    totalVorder.textContent = 'R' + totaleVordering;

}
); 



////////////////////////////////////////////////////////////////
//*************************GRAPHS****************************//

document.addEventListener('DOMContentLoaded', function () {
  toonInkomsteTeenUitgawes();
  toonUitgawesDeurKategorie();
});

function kryData(key) {
  const dataString = localStorage.getItem(key);
  return dataString ? dataString.split(';').filter(Boolean).map(entry => entry.split('|')) : [];
}

function toonInkomsteTeenUitgawes() {
  const inkomste = kryData('inkomsteLys');
  const uitgawes = kryData('uitgawesLys');

  const maandData = {};

  inkomste.forEach(([datum, , , bedrag]) => {
    const maand = datum.slice(0, 7);
    maandData[maand] = maandData[maand] || { inkomste: 0, uitgawes: 0 };
    maandData[maand].inkomste += parseFloat(bedrag);
  });

  uitgawes.forEach(([datum, , , bedrag]) => {
    const maand = datum.slice(0, 7);
    maandData[maand] = maandData[maand] || { inkomste: 0, uitgawes: 0 };
    maandData[maand].uitgawes += parseFloat(bedrag);
  });

  const labels = Object.keys(maandData).sort();
  const inkomsteData = labels.map(m => maandData[m].inkomste);
  const uitgaweData = labels.map(m => maandData[m].uitgawes);

  new Chart(document.getElementById('lynGrafiek'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Inkomste',
          borderColor: 'green',
          backgroundColor: 'rgba(0, 128, 0, 0.1)',
          data: inkomsteData,
          fill: true
        },
        {
          label: 'Uitgawes',
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          data: uitgaweData,
          fill: true
        }
      ]
    },
    options: {
    responsive: true,
    maintainAspectRatio: false // allows canvas to grow taller if needed
  }
  });
}

function toonUitgawesDeurKategorie() {
  const uitgawes = kryData('uitgawesLys');
  const kategorieMap = {};

  uitgawes.forEach(([ , , kategorie, bedrag]) => {
    kategorieMap[kategorie] = (kategorieMap[kategorie] || 0) + parseFloat(bedrag);
  });

  const labels = Object.keys(kategorieMap);
  const data = labels.map(k => kategorieMap[k]);

  new Chart(document.getElementById('sirkelGrafiek'), {
  type: 'pie',
  data: {
    labels,
    datasets: [{
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF'],
      data
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false // allows canvas to grow taller if needed
  }
});
}
