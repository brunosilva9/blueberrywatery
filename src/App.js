
import './App.css';

import React, { useState, useEffect } from "react";

const SummaryTable = ({ summary }) => {
  const sortedSummary = Object.keys(summary).sort((a, b) => new Date(a) - new Date(b));

  return (
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Kilos</th>
          <th>Trabajadores</th>
        </tr>
      </thead>
      <tbody>
        {sortedSummary.map((date) => (
          <tr key={date}>
            <td>{date}</td>
            <td>{summary[date].totalWeight}</td>
            <td>{new Set(summary[date].workers).size}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

function WorkerView({ data }) {
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [tW, settW] = useState(0);


  var totalWeight2=0;
  useEffect(() => {
    setWorkers(data.map(worker => worker.name));
   
  }, [data]);

  useEffect(() => {
    
    console.log(selectedWorker);
    if(selectedWorker){
      for (let i = 0; i < selectedWorker.dataArray.length; i++) {
        console.log(selectedWorker.dataArray[i].weight);
        totalWeight2 += 1*selectedWorker.dataArray[i].weight;
        console.log(totalWeight2)
      
    }
    settW(totalWeight2);
    }



  }, [selectedWorker]);

  function handleSelectChange(event) {
    const selectedName = event.target.value;
    const selectedWorkerData = data.find(worker => worker.name === selectedName);
    setSelectedWorker(selectedWorkerData);
 
  }

  return (
    <>
      <select onChange={handleSelectChange}>
        <option value="">Elige un trabajador</option>
        {workers.map(worker => (
          <option key={worker} value={worker}>
            {worker}
          </option>
        ))}
      </select>
      {selectedWorker && (
        <>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Kilos</th>
              </tr>
            </thead>
            <tbody>
              {selectedWorker.dataArray.map(day => (

                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{day.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4>Kilos Totales : {tW}</h4>
        </>


      )}
    </>
  );
}
const cheerio = require('cheerio');
var summary = {};
var workersArray;
function filterByDate(data, date) {
  return data.filter(element => element.date === date);
}
function fetchDataInParallel(rutdvArray) {
  let promiseArray = rutdvArray.map((rutdv) => {
    let formdata = new FormData();
    formdata.append("rutdv", rutdv);
    formdata.append("search", "Buscar");
    let requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };
    return fetch("https://cosecha.frutoslaaguada.cl/index.php", requestOptions)
      .then(response => response.text())
      .then(result => {
        let dataArray = []
        const $ = cheerio.load(result);
        let name = $('h5').text().split(':')[0];
        $('tr').each(function (i, elem) {
          let date = $(this).find('td').eq(1).text();
          let weight = $(this).find('td').eq(4).text();
          dataArray.push({ date, weight });
        });
        dataArray.pop();//last with totals
        dataArray.shift(); // fisrt empty
        //console.log(name)
        //console.log(dataArray)
        return { name, dataArray };
      });
  });

  return Promise.all(promiseArray).then(results => {

    results.forEach(result => {
      result.dataArray.forEach(element => {
        if (!summary[element.date]) {
          summary[element.date] = {
            totalWeight: 0,
            workers: []
          };
        }
        summary[element.date].totalWeight += parseFloat(element.weight);
        summary[element.date].workers.push(result.name);
      });
    });
    workersArray = results;
    console.log(workersArray);
    return summary;
  });
}
function App() {
  const [view, setView] = useState('general');

  const handleViewChange = (selectedView) => {
    setView(selectedView);
  }
  const rutdvArray = [
    '33596368-7',
    '33596082-3',
    '27580186-0',
    '33535392-7',
    '33636630-9',
    '25601952-3',
    '26348220-4',
    '15273053-5',
    '9552980-1',
    '25671933-9',
    '26624138-0',
    '33493407-1',
    '33596310-5',
    '27639526-2',
    '33536673-5',
    '26427599-7',
    '24974468-9',
    '33608032-0',
    '27645683-0',
    '27639562-9',
    '27447845-4',
    '26572006-4',
    '33468262-5',
    '18050495-8',
    '26845218-4',
    '33481406-8',
    '33535982-4',
    '21871527-3',
    '20371363-0',
    '33474251-2',
    '33609534-4',
    '12749192-5',
    '33609119-5',
    '33517571-9',
    '33610931-0',
    '26660365-7',
    '27973380-0',
    '33633635-k',
    '33633635-4',
    '33512990-3',
    '33512975-k',
    '12341023-8',
    '27623282-7',
    '27622991-5',
    '27629824-6',
    '33633593-0',
    '33600767-4',
    '33610880-2',
    '7876636-0',
    '26774498-2',
    '15697547-3',
    '25006179-k',
    '33603874-K',
    '33585659-7',
    '33477009-5',
  ]
  let dataArray = [];
  //var summary = { total: 0 };
  //fetchDataInParallel(rutdvArray);

  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchDataInParallel(rutdvArray).then(data => {
      console.log(data)
      setSummary(data);
      let filteredData = filterByDate(dataArray, "30/12/2022");
      console.log(filteredData);
    });
  }, []);


  /*

  rutdvArray.forEach(function (rutdv) {
    var formdata = new FormData();
    formdata.append("rutdv", rutdv);
    formdata.append("search", "Buscar");
    var requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };

    fetch("https://cosecha.frutoslaaguada.cl/index.php", requestOptions)
      .then(response => response.text())
      .then(result => {
        let jsonData = []
        const $ = cheerio.load(result);
        let name = $('h5').text().split(':')[0];
        if (name !== "No se encontraron resultados con el RUT ingresado.") {

          $('tr').each(function (i, elem) {
            let date = $(this).find('td').eq(1).text();
            let weight = $(this).find('td').eq(4).text();
            jsonData.push({ date, weight });
          });
          jsonData.pop();// last with the totals
          jsonData.shift();// fisrt empty
          let rutdvData = { name: name, data: jsonData };
          dataArray.push(rutdvData);
          //console.log(name);
          //console.log(jsonData);
        }
        else {
          console.log("no se encuentra " + rutdv)
        }

      })
      .then(() => {
        dataArray.forEach(function (rutdvData) {
          rutdvData.data.forEach(function (dateWeight) {
            if (!summary[dateWeight.date]) {
              summary[dateWeight.date] = 0;
            }
            summary[dateWeight.date] += parseFloat(dateWeight.weight);
            summary.total += parseFloat(dateWeight.weight);
          });
        });
      }

      )
      .catch(error => console.log('error', error));
  });
  console.log(dataArray)
*/
  //18 154701

  console.log(summary);




  //console.log(requestOptions)

  return (
    <div className="App">
      <div>
        <select value={view} onChange={(e) => handleViewChange(e.target.value)}>
          <option value="general">General</option>
          <option value="specific">Especifico</option>
        </select>
        {view === 'general' ? <SummaryTable summary={summary} /> : <WorkerView data={workersArray} />}
      </div>

    </div>
  );
}

export default App;
