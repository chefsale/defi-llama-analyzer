import React, { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CheckboxFilter = ({ options, selectedOptions, onChange, title, onSelectAll, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = options
    .filter(option => option != null)
    .filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="filter-group" ref={dropdownRef}>
      <div className="filter-header" onClick={() => setIsOpen(!isOpen)}>
        <h5>{title}</h5>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="checkbox-container-wrapper">
          <div className="checkbox-container">
            <div className="checkbox-actions">
              <button onClick={onSelectAll}>Select All</button>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button onClick={onClear}>Clear</button>
            </div>
            <div className="checkbox-list">
              {filteredOptions.map((option) => (
                <div key={option} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`checkbox-${title}-${option}`}
                    checked={selectedOptions.includes(option)}
                    onChange={() => onChange(option)}
                  />
                  <label htmlFor={`checkbox-${title}-${option}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [data, setData] = useState({ raises: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: [],
    category: [],
    round: [],
    sector: []
  });
  const [options, setOptions] = useState({
    name: [],
    category: [],
    round: [],
    sector: []
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
        updateFilterOptions(data.raises);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError('Error fetching data: ' + error.message);
        setLoading(false);
      });
  }, []);

  const updateFilterOptions = (raises) => {
    const newOptions = {
      name: [...new Set(raises.map(item => item.name).filter(Boolean))],
      category: [...new Set(raises.map(item => item.category).filter(Boolean))],
      round: [...new Set(raises.map(item => item.round).filter(Boolean))],
      sector: [...new Set(raises.map(item => item.sector).filter(Boolean))]
    };
    setOptions(newOptions);
    // Set all filters to be selected by default
    setFilters(newOptions);
  };

  const handleFilterChange = (option, filterType) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: prevFilters[filterType].includes(option)
        ? prevFilters[filterType].filter(item => item !== option)
        : [...prevFilters[filterType], option]
    }));
  };

  const handleSelectAll = (filterType) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: [...options[filterType]]
    }));
  };

  const handleClear = (filterType) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: []
    }));
  };

  const filteredData = data.raises.filter(item => {
    return (
      (filters.name.length === 0 || filters.name.includes(item.name)) &&
      (filters.category.length === 0 || filters.category.includes(item.category)) &&
      (filters.round.length === 0 || filters.round.includes(item.round)) &&
      (filters.sector.length === 0 || filters.sector.includes(item.sector))
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(Number(dateString) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const sortMonths = (monthYearArray) => {
    return monthYearArray.sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateB - dateA; // For descending order
    });
  };

  const generateChartData = () => {
    const monthlyData = {};

    filteredData.forEach((item) => {
      const date = new Date(Number(item.date) * 1000);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }

      monthlyData[monthYear] += parseFloat(item.amount);
    });

    const sortedMonths = sortMonths(Object.keys(monthlyData));

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Amount Raised',
          data: sortedMonths.map(month => monthlyData[month]),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };
  };

  const generateRoundsChartData = () => {
    const monthlyRoundData = {};
    const roundCounts = {};

    filteredData.forEach((item) => {
      const date = new Date(Number(item.date) * 1000);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      const round = item.round || 'Unknown';

      if (!monthlyRoundData[monthYear]) {
        monthlyRoundData[monthYear] = {};
      }

      if (!monthlyRoundData[monthYear][round]) {
        monthlyRoundData[monthYear][round] = 0;
      }

      monthlyRoundData[monthYear][round]++;
      roundCounts[round] = (roundCounts[round] || 0) + 1;
    });

    const sortedMonths = sortMonths(Object.keys(monthlyRoundData));
    const top12Rounds = Object.entries(roundCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([round]) => round);

    const datasets = top12Rounds.map((round) => ({
      label: round,
      data: sortedMonths.map((month) => monthlyRoundData[month][round] || 0),
      backgroundColor: getRandomColor(),
    }));

    return { labels: sortedMonths, datasets };
  };

  const generateInvestorChartData = () => {
    const investorData = {};

    filteredData.forEach((item) => {
      const investors = [...(item.leadInvestors || []), ...(item.otherInvestors || [])];
      const amount = parseFloat(item.amount) || 0;

      investors.forEach((investor) => {
        if (!investorData[investor]) {
          investorData[investor] = 0;
        }
        investorData[investor] += amount / investors.length; // Distribute amount equally among investors
      });
    });

    // Sort investors by total investment amount
    const sortedInvestors = Object.entries(investorData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 120); // Get top 120 investors

    return {
      labels: sortedInvestors.map(([investor]) => investor),
      datasets: [
        {
          label: 'Total Investment',
          data: sortedInvestors.map(([, amount]) => amount),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
        },
      ],
    };
  };

  const getRandomColor = () => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
  };

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
        <div className="filters-container">
          <CheckboxFilter
            options={options.name}
            selectedOptions={filters.name}
            onChange={(option) => handleFilterChange(option, 'name')}
            onSelectAll={() => handleSelectAll('name')}
            onClear={() => handleClear('name')}
            title="Filter by Name"
          />
          <CheckboxFilter
            options={options.category}
            selectedOptions={filters.category}
            onChange={(option) => handleFilterChange(option, 'category')}
            onSelectAll={() => handleSelectAll('category')}
            onClear={() => handleClear('category')}
            title="Filter by Category"
          />
          <CheckboxFilter
            options={options.round}
            selectedOptions={filters.round}
            onChange={(option) => handleFilterChange(option, 'round')}
            onSelectAll={() => handleSelectAll('round')}
            onClear={() => handleClear('round')}
            title="Filter by Round"
          />
          <CheckboxFilter
            options={options.sector}
            selectedOptions={filters.sector}
            onChange={(option) => handleFilterChange(option, 'sector')}
            onSelectAll={() => handleSelectAll('sector')}
            onClear={() => handleClear('sector')}
            title="Filter by Sector"
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
                    <td>{formatDate(item.date)}</td>
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
        <div className="row">
          <div className="col-md-6">
            <div className="chart-container">
              <h2>Monthly Fundraising</h2>
              <Bar options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: false,
                  },
                },
              }} data={generateChartData()} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="chart-container">
              <h2>Projects Raised by Round (Top 12)</h2>
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: false,
                    },
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    x: {
                      stacked: true,
                    },
                    y: {
                      stacked: true,
                    },
                  },
                }}
                data={generateRoundsChartData()}
              />
            </div>
          </div>
          <div className="col-md-6 offset-md-0">
            <div className="chart-container">
              <h2>Top 120 Investors by Total Investment</h2>
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: false,
                    },
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Total Investment Amount',
                      },
                    },
                  },
                }}
                data={generateInvestorChartData()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;




















