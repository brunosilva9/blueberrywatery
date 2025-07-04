import './App.css';
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal } from 'reactstrap';
const cheerio = require('cheerio');

// Componente para mostrar detalles del día
const DayDetailsModal = ({ isOpen, toggle, date, workerNames, totalWeight }) => (
  <Modal isOpen={isOpen} toggle={toggle}>
    <div className="modal-content">
      <h5>Detalle - {date}</h5>
      <p><strong>Trabajadores:</strong> {workerNames?.join(", ")}</p>
      <p><strong>Kilos totales:</strong> {totalWeight.toFixed(2)}</p>
      <button className="close-button" onClick={toggle}>Cerrar</button>
    </div>
  </Modal>
);

// Componente para la tabla resumen
const SummaryTable = ({ summary }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  // Memoizar el cálculo de fechas ordenadas
  const sortedDates = useMemo(() =>
    Object.keys(summary).sort((a, b) => new Date(a) - new Date(b)),
    [summary]
  );

  // Memoizar el cálculo de trabajadores únicos por día
  const getUniqueWorkersCount = useCallback((workers) =>
    new Set(workers).size,
    []
  );

  return (
    <>
      <table className="summary-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Kilos</th>
            <th>Trabajadores</th>
          </tr>
        </thead>
        <tbody>
          {sortedDates.map((date) => (
            <tr key={date} onClick={() => setSelectedDay(date)}>
              <td>{date}</td>
              <td>{summary[date].totalWeight.toFixed(2)}</td>
              <td>{getUniqueWorkersCount(summary[date].workers)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedDay && (
        <DayDetailsModal
          isOpen={!!selectedDay}
          toggle={() => setSelectedDay(null)}
          date={selectedDay}
          workerNames={summary[selectedDay].workers}
          totalWeight={summary[selectedDay].totalWeight}
        />
      )}
    </>
  );
};

// Componente para vista de trabajador
const WorkerView = ({ data }) => {
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Calcular total de kilos
  const totalWeight = useMemo(() =>
    selectedWorker?.dataArray.reduce((sum, day) => sum + parseFloat(day.weight), 0) || 0,
    [selectedWorker]
  );

  const handleSelectChange = (e) => {
    const worker = data.find(w => w.name === e.target.value);
    setSelectedWorker(worker);
  };

  return (
    <div className="worker-view">
      <select
        onChange={handleSelectChange}
        className="worker-select"
        defaultValue=""
      >
        <option value="" disabled>Elige un trabajador</option>
        {data.map(worker => (
          <option key={worker.name} value={worker.name}>
            {worker.name}
          </option>
        ))}
      </select>

      {selectedWorker && (
        <div className="worker-details">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Kilos</th>
              </tr>
            </thead>
            <tbody>
              {selectedWorker.dataArray.map((day, i) => (
                <tr key={`${day.date}-${i}`}>
                  <td>{day.date}</td>
                  <td>{day.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-weight">
            Kilos Totales: {totalWeight.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

// Función para procesar datos de trabajador
const processWorkerData = (html, rutdv) => {
  const $ = cheerio.load(html);
  const name = $('h5').text().split(':')[0].trim();

  if (name === "No se encontraron resultados con el RUT ingresado.") {
    console.warn(`No se encuentra trabajador con RUT: ${rutdv}`);
    return null;
  }

  const dataArray = [];
  $('tr').each(function () {
    const date = $(this).find('td').eq(1).text().trim();
    const weight = $(this).find('td').eq(4).text().trim();
    if (date && weight) dataArray.push({ date, weight });
  });

  return {
    name,
    dataArray: dataArray // Eliminar cabecera y pie
  };
};

// Hook personalizado para manejar datos
const useWorkerData = (rutdvArray) => {
  const [state, setState] = useState({
    summary: {},
    workers: [],
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    try {
      const requests = rutdvArray.map(rutdv => {
        const formData = new FormData();
        formData.append("rutdv", rutdv);
        formData.append("search", "Buscar");

        return fetch(`https://blueberry-proxy.onrender.com/scrape?rutdv=${rutdv}`)
          .then(res => res.text())
          .then(html => processWorkerData(html, rutdv));
      });

      const results = await Promise.all(requests);
      const validResults = results.filter(Boolean);

      const newSummary = {};
      validResults.forEach(worker => {
        worker.dataArray.forEach(day => {
          if (!newSummary[day.date]) {
            newSummary[day.date] = {
              totalWeight: 0,
              workers: []
            };
          }
          newSummary[day.date].totalWeight += parseFloat(day.weight) || 0;
          newSummary[day.date].workers.push(worker.name);
        });
      });

      setState({
        summary: newSummary,
        workers: validResults,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Error al cargar datos"
      }));
      console.error("Fetch error:", error);
    }
  }, [rutdvArray]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

// Componente principal
const App = () => {
  const [view, setView] = useState('general');

  // Memoizar el array de RUTs para evitar recreación
  const rutdvArray = useMemo(() => [
    '10594465-9',
    '11429466-7',
    '11594901-2',
    '11707665-2'
  ], []);

  const { summary, workers, loading, error } = useWorkerData(rutdvArray);

  if (loading) return <div className="loading">Cargando datos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="App">
      <div className="app-container">
        <div className="view-selector">
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            aria-label="Seleccionar vista"
          >
            <option value="general">Vista General</option>
            <option value="specific">Vista por Trabajador</option>
          </select>
        </div>

        <div className="view-content">
          {view === 'general' ? (
            <SummaryTable summary={summary} />
          ) : (
            <WorkerView data={workers} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;