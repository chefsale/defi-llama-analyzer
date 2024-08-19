import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    round: '',
    sector: ''
  });

  useEffect(() => {
    console.log('Fetching data from backend...');
    fetch('http://127.0.0.1:5000/defillama')
      .then(response => {
        console.log('Response received:', response);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Data received:', data);
        if (!data.raises || !Array.isArray(data.raises)) {
          throw new Error('Invalid data format received');
        }
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError('Error fetching data: ' + error.message);
        setLoading(false);
      });
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const filteredData = data.raises ? data.raises.filter(item => {
    return (
      ((item.name && item.name.toLowerCase().includes(filters.name.toLowerCase())) || filters.name === '') &&
      ((item.category && item.category.toLowerCase().includes(filters.category.toLowerCase())) || filters.category === '') &&
      ((item.round && item.round.toLowerCase().includes(filters.round.toLowerCase())) || filters.round === '') &&
      ((item.sector && item.sector.toLowerCase().includes(filters.sector.toLowerCase())) || filters.sector === '')
    );
  }) : [];

  if (loading) {
    return <div className="container mt-5"><div className="alert alert-info">Loading...</div></div>;
  }

  if (error) {
    return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div className="App">
      <div className="container-fluid py-4">
        <h1 className="mb-4">Data from DefiLlama</h1>
        <div className="filters">
          <input
            type="text"
            name="name"
            placeholder="Filter by Name"
            value={filters.name}
            onChange={handleFilterChange}
            className="form-control"
          />
          <input
            type="text"
            name="category"
            placeholder="Filter by Category"
            value={filters.category}
            onChange={handleFilterChange}
            className="form-control"
          />
          <input
            type="text"
            name="round"
            placeholder="Filter by Round"
            value={filters.round}
            onChange={handleFilterChange}
            className="form-control"
          />
          <input
            type="text"
            name="sector"
            placeholder="Filter by Sector"
            value={filters.sector}
            onChange={handleFilterChange}
            className="form-control"
          />
        </div>
        <div className="table-responsive">
          {filteredData.length > 0 ? (
            <table className="table table-striped table-bordered table-hover table-sm">
              <thead className="thead-dark">
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
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name || 'N/A'}</td>
                    <td>{item.amount || 'N/A'}</td>
                    <td>{item.category || 'N/A'}</td>
                    <td>{item.chains ? item.chains.join(', ') : 'N/A'}</td>
                    <td>{item.date || 'N/A'}</td>
                    <td>{item.leadInvestors ? item.leadInvestors.join(', ') : 'N/A'}</td>
                    <td>{item.otherInvestors ? item.otherInvestors.join(', ') : 'N/A'}</td>
                    <td>{item.round || 'N/A'}</td>
                    <td>{item.sector || 'N/A'}</td>
                    <td>{item.source || 'N/A'}</td>
                    <td>{item.valuation || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="alert alert-info">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;




















