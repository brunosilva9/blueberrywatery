
import './App.css';

import React, { useState, useEffect } from "react";

import { Modal } from 'reactstrap'

const cheerio = require('cheerio');
var summary = {};
var workersArray;

const SummaryTable = ({ summary }) => {
  const sortedSummary = Object.keys(summary).sort((a, b) => new Date(a) - new Date(b));
  var [selectedDayData, setSelectedDayData] = useState({});
  var [showModal, setShowModal] = useState(false);

  const handleRowClick = dayData => {
    setSelectedDayData(dayData);
    setShowModal(true);
  };
  const RenderModal = () => {
    return (
      showModal && (
        <Modal>
          <div>Worker Names: {selectedDayData.workerNames.join(", ")}</div>
          <div>Worker Weights: {selectedDayData.workerWeights.join(", ")}</div>
        </Modal>
      )
    );
  };
  return (
    <>
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
            <tr key={date} onClick={() => handleRowClick(date)}>
              <td>{date}</td>
              <td>{summary[date].totalWeight}</td>
              <td>{new Set(summary[date].workers).size}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <RenderModal />
    </>

  );
};
function WorkerView({ data }) {
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [tW, settW] = useState(0);


  var totalWeight2 = 0;
  useEffect(() => {
    setWorkers(data.map(worker => worker.name));

  }, [data]);

  useEffect(() => {

    console.log(selectedWorker);
    if (selectedWorker) {
      for (let i = 0; i < selectedWorker.dataArray.length; i++) {
        console.log(selectedWorker.dataArray[i].weight);
        totalWeight2 += 1 * selectedWorker.dataArray[i].weight;
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
    return fetch("/index.php", requestOptions)
      .then(response => response.text())
      .then(result => {
        let dataArray = []
        const $ = cheerio.load(result);
        let name = $('h5').text().split(':')[0];
        if (name !== "No se encontraron resultados con el RUT ingresado.") {
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
        }
        else {
          console.log("no se encuentra " + rutdv)
        }

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
    '27158504-7',
    '26036209-7',
    '25852344-K',
    '26802354-2',
    '33738955-4',
    '27580186-0',
    '33486581-9',
    '33512975-K',
    '33625537-6',

  ]
  let dataArray = [];
  //var summary = { total: 0 };
  //fetchDataInParallel(rutdvArray);

  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchDataInParallel(rutdvArray).then(data => {
      console.log(data)
      setSummary(data);
      //let filteredData = filterByDate(dataArray, "30/12/2022");
      //console.log(filteredData);
    });
  }, []);

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
