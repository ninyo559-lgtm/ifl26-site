import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'white', 
      color: 'black',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>Hello World</h1>
      <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>IFL 26 Diagnostic Mode</p>
    </div>
  );
};

export default App;
