import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Table.css';

const Table = () => {
  const [latestData, setLatestData] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to socket.io server');
      setConnectionStatus('connected');
      setError(null);
    });

    socket.on('sensorData', (data) => {
      console.log('Received sensor data:', data);
      setLatestData(Array.isArray(data) ? data : [data]); // Handle both array and single object
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket.io server');
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setConnectionStatus('error');
      setError('Failed to connect to server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="table-container">
      <h2>Live Sensor Data</h2>
      <div className="connection-status">
        Status: {connectionStatus} {error && `- ${error}`}
      </div>
      
      <table className="sensor-table">
        <thead>
          <tr>
            <th>Sewage Level</th>
            <th>Methane Level</th>
            <th>Battery Level</th>
          </tr>
        </thead>
        <tbody>
          {latestData.length > 0 ? (
            latestData.map((data, index) => (
              <tr key={index}>
                <td>{data.sewage ?? 'N/A'}</td>
                <td>{data.methane ?? 'N/A'}</td>
                <td>{data.battery ?? 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;