export default function AppTest() {
  return (
    <div style={{ 
      backgroundColor: '#000033', 
      color: '#ffffff', 
      padding: '20px', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>✅ React is Working!</h1>
      <p>If you see this message, React rendering is successful.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#003300', borderRadius: '5px' }}>
        <p>Current Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
