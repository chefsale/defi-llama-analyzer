import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/defillama')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError('Error fetching data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
      <h1>Data from DefiLlama</h1>
        {data.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Chains</th>
                <th>Date</th>
                <th>Lead Investors</th>
                <th>Other Investors</th>
                <th>Round</th>
                <th>Sector</th>
                <th>Source</th>
                <th>Valuation</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.amount}</td>
                  <td>{item.category}</td>
                  <td>{item.chains ? item.chains.join(', ') : ''}</td>
                  <td>{item.date}</td>
                  <td>{item.leadInvestors ? item.leadInvestors.join(', ') : ''}</td>
                  <td>{item.otherInvestors ? item.otherInvestors.join(', ') : ''}</td>
                  <td>{item.round}</td>
                  <td>{item.sector}</td>
                  <td>{item.source}</td>
                  <td>{item.valuation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No data available</div>
        )}
      </header>
    </div>
  );
}

export default App;


















