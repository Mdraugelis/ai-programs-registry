import React from 'react';

const TestSimple: React.FC = () => {
  console.log('TestSimple component rendering');
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Component</h1>
      <p>If you can see this, React routing is working.</p>
    </div>
  );
};

export default TestSimple;