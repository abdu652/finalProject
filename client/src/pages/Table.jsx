import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Table.css';

const Table = () => {
  const [sensorDataHistory, setSensorDataHistory] = useState([]);
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

    socket.on('sensorData', (newData) => {
      console.log('Received sensor data:', newData);
      
      // Handle both array and single object data
      const newDataArray = Array.isArray(newData) ? newData : [newData];
      
      // Add timestamp if not present
      const dataWithTimestamps = newDataArray.map(item => ({
        ...item,
        timestamp: item.timestamp || new Date().toLocaleTimeString()
      }));
      
      // Append new data to history
      setSensorDataHistory(prevHistory => [
        ...prevHistory,
        ...dataWithTimestamps
      ]);
      
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
      <div className="connection-status" data-status={connectionStatus}>
        Status: {connectionStatus} {error && `- ${error}`}
      </div>
      
      <div className="table-wrapper">
        <table className="sensor-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Sewage Level</th>
              <th>Methane Level</th>
              <th>Battery Level</th>
            </tr>
          </thead>
          <tbody>
            {sensorDataHistory.length > 0 ? (
              sensorDataHistory.map((data, index) => (
                <tr key={index}>
                  <td>{data.timestamp}</td>
                  <td>{data.sewage ?? 'N/A'}</td>
                  <td>{data.methane ?? 'N/A'}</td>
                  <td>{data.battery ?? 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;