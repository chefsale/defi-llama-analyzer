import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function InvestorPage() {
  const { slug } = useParams();
  const [investorData, setInvestorData] = useState([]);
  const [roundData, setRoundData] = useState({});
  const [coInvestorData, setCoInvestorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.llama.fi/raises');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        console.log('Data type:', typeof data);
        console.log('Is array?', Array.isArray(data));

        let raisesData;
        if (Array.isArray(data)) {
          raisesData = data;
        } else if (typeof data === 'object' && data !== null) {
          console.log('Data keys:', Object.keys(data));
          if (Array.isArray(data.raises)) {
            raisesData = data.raises;
          } else {
            throw new Error('Unexpected data format: raises property is not an array');
          }
        } else {
          throw new Error('Unexpected data format: not an array or object');
        }

        const investorName = slug.replace(/-/g, ' ').toLowerCase();
        console.log('Looking for investor:', investorName);

        const filteredData = raisesData.filter(item => {
          const isLeadInvestor = item.leadInvestors && Array.isArray(item.leadInvestors) && 
                                 item.leadInvestors.some(investor => investor.toLowerCase() === investorName);
          const isOtherInvestor = item.otherInvestors && Array.isArray(item.otherInvestors) && 
                                  item.otherInvestors.some(investor => investor.toLowerCase() === investorName);
          return isLeadInvestor || isOtherInvestor;
        });

        console.log('Filtered data:', filteredData);

        setInvestorData(filteredData);
        setRoundData(processRoundData(filteredData));
        setCoInvestorData(processCoInvestorData(filteredData, investorName));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching or processing data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const processRoundData = (data) => {
    const rounds = {};
    data.forEach(item => {
      if (item.round) {
        if (!rounds[item.round]) rounds[item.round] = 0;
        rounds[item.round] += parseFloat(item.amount) || 0;
      }
    });
    console.log('Processed round data:', rounds);
    return rounds;
  };

  const processCoInvestorData = (data, investorName) => {
    const coInvestors = {};
    data.forEach(item => {
      const allInvestors = [...(item.leadInvestors || []), ...(item.otherInvestors || [])];
      allInvestors.forEach(investor => {
        if (investor.toLowerCase() !== investorName) {
          if (!coInvestors[investor]) coInvestors[investor] = 0;
          coInvestors[investor]++;
        }
      });
    });
    console.log('Processed co-investor data:', coInvestors);
    return coInvestors;
  };

  const renderPieChart = (data, title) => {
    if (Object.keys(data).length === 0) {
      return <p>No data available for {title}</p>;
    }

    const chartData = {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: Object.keys(data).map(() => `rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 0.6)`),
      }],
    };

    return (
      <div style={{ width: '400px', height: '400px', margin: '20px' }}>
        <h2>{title}</h2>
        <Pie data={chartData} />
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}. Please check the console for more details.</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        Investor: {slug.replace(/-/g, ' ').toUpperCase()}
      </h1>
      
      <h2>Investments</h2>
      {investorData.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Project</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Amount</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Round</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {investorData.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.amount}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.round}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {new Date(Number(item.date) * 1000).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No investment data available for this investor.</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        {renderPieChart(roundData, 'Investments by Round')}
        {renderPieChart(coInvestorData, 'Co-Investors')}
      </div>
    </div>
  );
}

export default InvestorPage;