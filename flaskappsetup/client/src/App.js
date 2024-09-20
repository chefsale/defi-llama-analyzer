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
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoundPage from './RoundPage';
import InvestorPage from './InvestorPage';

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

  const [fundRaisingTimeFrame, setFundRaisingTimeFrame] = useState('monthly');
  const [roundsTimeFrame, setRoundsTimeFrame] = useState('monthly');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.llama.fi/raises');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const fetchedData = await response.json();
        console.log('Fetched data:', JSON.stringify(fetchedData, null, 2));
        setData(fetchedData);
        setLoading(false);
        updateFilterOptions(fetchedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error fetching data: ' + error.message);
        setLoading(false);
      }
    };
  
    fetchData();
  
    // Set up an interval to fetch data every 5 minutes (300000 milliseconds)
    const intervalId = setInterval(fetchData, 300000);
  
    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const sortDates = (dates) => {
    return dates.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB - dateA;  // Changed from dateA - dateB to dateB - dateA
    });
  };

  const updateFilterOptions = (raises) => {
    if (!Array.isArray(raises)) {
      console.error('updateFilterOptions received non-array data');
      return;
    }
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

  const getTimeFrameKey = (date, timeFrame) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
  
    switch (timeFrame) {
      case 'yearly':
        return `${year}`;
      case 'quarterly':
        return `Q${quarter} ${year}`;
      case 'monthly':
      default:
        return `${year}-${(month + 1).toString().padStart(2, '0')}`; // Format: YYYY-MM
    }
  };

  const sortTimeFrames = (timeFrameArray, timeFrame) => {
    return timeFrameArray.sort((a, b) => {
      let dateA, dateB;
      switch (timeFrame) {
        case 'yearly':
          return b.localeCompare(a);
        case 'quarterly':
          [, dateA] = a.split(' ');
          [, dateB] = b.split(' ');
          return dateB.localeCompare(dateA) || b.localeCompare(a);
        case 'monthly':
        default:
          dateA = new Date(a);
          dateB = new Date(b);
          return dateB - dateA;
      }
    });
  };


  const generateChartData = (timeFrame) => {
    const timeFrameData = {};
  
    filteredData.forEach((item) => {
      const date = new Date(Number(item.date) * 1000);
      const key = getTimeFrameKey(date, timeFrame);
  
      if (!timeFrameData[key]) {
        timeFrameData[key] = 0;
      }
  
      timeFrameData[key] += parseFloat(item.amount);
    });
  
    let sortedTimeFrames;
    if (timeFrame === 'monthly') {
      sortedTimeFrames = sortDates(Object.keys(timeFrameData));
    } else {
      sortedTimeFrames = sortTimeFrames(Object.keys(timeFrameData), timeFrame).reverse();  // Added .reverse()
    }
  
    return {
      labels: sortedTimeFrames,
      datasets: [
        {
          label: 'Amount Raised',
          data: sortedTimeFrames.map(tf => timeFrameData[tf]),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };
  };

  const generateRoundsChartData = (timeFrame) => {
    const timeFrameRoundData = {};
    const roundCounts = {};
  
    filteredData.forEach((item) => {
      const date = new Date(Number(item.date) * 1000);
      const key = getTimeFrameKey(date, timeFrame);
      const round = item.round || 'Unknown';
  
      if (!timeFrameRoundData[key]) {
        timeFrameRoundData[key] = {};
      }
  
      if (!timeFrameRoundData[key][round]) {
        timeFrameRoundData[key][round] = 0;
      }
  
      timeFrameRoundData[key][round]++;
      roundCounts[round] = (roundCounts[round] || 0) + 1;
    });
  
    let sortedTimeFrames;
    if (timeFrame === 'monthly') {
      sortedTimeFrames = sortDates(Object.keys(timeFrameRoundData));
    } else {
      sortedTimeFrames = sortTimeFrames(Object.keys(timeFrameRoundData), timeFrame).reverse();  // Added .reverse()
    }
  
    const top12Rounds = Object.entries(roundCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([round]) => round);
  
    const datasets = top12Rounds.map((round) => ({
      label: round,
      data: sortedTimeFrames.map((tf) => timeFrameRoundData[tf][round] || 0),
      backgroundColor: getRandomColor(),
    }));
  
    return { labels: sortedTimeFrames, datasets };
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

  const generateSlug = (name) => {
    return (name || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };



  if (loading) {
    return <div className="container mt-5"><div className="alert alert-info">Loading...</div></div>;
  }

  if (error) {
    return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
  }

  const generateCategoryInvestmentChartData = () => {
    const categoryData = {};
  
    filteredData.forEach((item) => {
      const category = item.category;
      const amount = parseFloat(item.amount) || 0;
  
      if (category && category.toLowerCase() !== 'unknown' && category.toLowerCase() !== 'undefined') {
        if (!categoryData[category]) {
          categoryData[category] = 0;
        }
        categoryData[category] += amount;
      }
    });
  
    // Sort categories by total investment amount and get top 15
    const sortedCategories = Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 120);
  
    return {
      labels: sortedCategories.map(([category]) => category),
      datasets: [
        {
          label: 'Total Investment',
          data: sortedCategories.map(([, amount]) => amount),
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
        },
      ],
    };
  };

  const generateChainsInvestmentChartData = () => {
    const chainData = {};
  
    filteredData.forEach((item) => {
      const amount = parseFloat(item.amount) || 0;
      let chains = item.chains;
  
      if (Array.isArray(chains) && chains.length > 0) {
        chains.forEach((chain) => {
          const chainName = chain.trim();
          if (chainName && chainName.toLowerCase() !== 'unknown' && chainName.toLowerCase() !== 'undefined') {
            if (!chainData[chainName]) {
              chainData[chainName] = 0;
            }
            chainData[chainName] += amount / chains.length;
          }
        });
      }
    });
  
    // Sort chains by total investment amount and get top 15
    const sortedChains = Object.entries(chainData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 120);
  
    return {
      labels: sortedChains.map(([chain]) => chain),
      datasets: [
        {
          label: 'Total Investment',
          data: sortedChains.map(([, amount]) => amount),
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
        },
      ],
    };
  };

  const sortData = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    } else if (key === 'date') {
      direction = 'descending';  // Default to descending for dates
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(Number(a.date) * 1000);
        const dateB = new Date(Number(b.date) * 1000);
        return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
      }
      
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  return (
    <Router>
    <div className="App">
      <Routes>
      <Route path="/" element={
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
          {data.raises.length > 0 ? (
            <table className="table table-striped table-bordered table-hover table-sm">
              <thead className="thead-dark">
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Chains</th>
                  <th onClick={() => sortData('date')} style={{cursor: 'pointer'}}>
                    Date {sortConfig.key === 'date' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '▼'}
                  </th>
                  <th>Lead Investors</th>
                  <th>Other Investors</th>
                  <th>Round</th>
                  <th>Sector</th>
                  <th>Source</th>
                  <th>Valuation</th>
                </tr>
              </thead>
              <tbody>
                {getSortedData(filteredData).map((item, index) => (
                  <tr key={index}>
                    <td>{item.name || 'N/A'}</td>
                    <td>{item.amount || 'N/A'}</td>
                    <td>{item.category || 'N/A'}</td>
                    <td>{item.chains ? item.chains.join(', ') : 'N/A'}</td>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      {item.leadInvestors ? item.leadInvestors.map((investor, i) => (
                        <React.Fragment key={i}>
                          <a 
                            href={`/investor/${generateSlug(investor)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {investor}
                          </a>
                          {i < item.leadInvestors.length - 1 ? ', ' : ''}
                        </React.Fragment>
                      )) : 'N/A'}
                    </td>
                    <td>
                      {item.otherInvestors ? item.otherInvestors.map((investor, i) => (
                        <React.Fragment key={i}>
                          <a 
                            href={`/investor/${generateSlug(investor)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {investor}
                          </a>
                          {i < item.otherInvestors.length - 1 ? ', ' : ''}
                        </React.Fragment>
                      )) : 'N/A'}
                    </td>
                    <td>
                      <a 
                        href={`/round/${generateSlug(item.round)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {item.round || 'N/A'}
                      </a>
                    </td>
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
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2>Fundraising</h2>
                <select 
                  value={fundRaisingTimeFrame} 
                  onChange={(e) => setFundRaisingTimeFrame(e.target.value)}
                  className="form-select" 
                  style={{width: 'auto'}}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <Bar 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: false,
                    },
                  },
                }} 
                data={generateChartData(fundRaisingTimeFrame)} 
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="chart-container">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2>Projects Raised by Round (Top 12)</h2>
                <select 
                  value={roundsTimeFrame} 
                  onChange={(e) => setRoundsTimeFrame(e.target.value)}
                  className="form-select" 
                  style={{width: 'auto'}}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
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
                data={generateRoundsChartData(roundsTimeFrame)}
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
          <div className="col-md-6">
            <div className="chart-container">
             <h2>Top 120 Categories by Total Investment</h2>
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
               data={generateCategoryInvestmentChartData()}
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="chart-container">
              <h2>Top 120 Chains by Total Investment</h2>
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
                data={generateChainsInvestmentChartData()}
              />
            </div>   
          </div>
        </div>
      </div>
      } />
      <Route path="/round/:slug" element={<RoundPage />} />
      <Route path="/investor/:slug" element={<InvestorPage />} />
      </Routes>
    </div>
    </Router>
  );
}

export default App;




















