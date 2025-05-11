import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Table.css';

const Table = () => {
  const [latestData, setLatestData] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to socket.io server');
    });

    socket.on('sensorData', (data) => {
      console.log('Received sensor data:', data);
      setLatestData(data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket.io server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="table-container">
      <h2>Live Sensor Data</h2>
      {latestData ? (
        <table className="sensor-table">
          <thead>
            <tr>
              <th>Sewage Level</th>
              <th>Methane Level</th>
              <th>Battery Level</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{latestData.sewage}</td>
              <td>{latestData.methane}</td>
              <td>{latestData.battery}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="loading-text">Waiting for sensor data...</p>
      )}
    </div>
  );
};

export default
