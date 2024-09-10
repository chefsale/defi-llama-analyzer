import React from 'react';
import { useParams } from 'react-router-dom';

function RoundPage() {
  const { slug } = useParams();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        Round: {slug.replace(/-/g, ' ').toUpperCase()}
      </h1>
      <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
        This page is currently under construction. In the future, it will display detailed information about the {slug.replace(/-/g, ' ').toUpperCase()} funding round.
      </p>
      <p style={{ fontSize: '16px', color: '#666' }}>
        Stay tuned for updates including statistics, participating investors, and more.
      </p>
    </div>
  );
}

export default RoundPage;