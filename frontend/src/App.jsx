import React, { useState } from 'react';
import { Shield, AlertTriangle, Map, Building2, Github, Info, Camera } from 'lucide-react';
import ReportForm from './components/ReportForm';
import HeatMap from './components/HeatMap';
import HospitalLocator from './components/HospitalLocator';
import ImageAnalyzer from './components/ImageAnalyzer';

function App() {
  console.log('✅ App component loaded');
  const [activeTab, setActiveTab] = useState('report');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  
  React.useEffect(() => {
    console.log('✅ App component mounted, activeTab:', activeTab);
  }, [activeTab]);

  const tabs = [
    { id: 'report', name: 'Report Bite', icon: AlertTriangle },
    { id: 'analyzer', name: 'Image Analyzer', icon: Camera },
    { id: 'map', name: 'Heatmap', icon: Map },
    { id: 'hospitals', name: 'Find Hospitals', icon: Building2 }
  ];

  const handleReportSuccess = (result) => {
    setReportResult(result);
    setTimeout(() => {
      setActiveTab('hospitals');
    }, 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)', color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(5, 46, 22, 0.5)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#65a30d', padding: '8px', borderRadius: '8px' }}>
              <Shield size={24} color='#ffffff' />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#84cc16' }}>SylvanGuard</h1>
              <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0 0' }}>Bite Emergency Detection System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeTab === tab.id ? '#65a30d' : 'transparent',
                    color: activeTab === tab.id ? '#ffffff' : '#ccc',
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(101, 163, 13, 0.2)';
                    }
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.textShadow = '0 2px 8px rgba(132, 204, 22, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = activeTab === tab.id ? '#65a30d' : 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.textShadow = 'none';
                  }}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Emergency Banner */}
      <div style={{ padding: '12px 20px', backgroundColor: '#dc2626', textAlign: 'center' }}>
        <p style={{ margin: '0', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <AlertTriangle size={20} /> Emergency? Call 108 (Ambulance) | Keep victim calm | Do NOT apply ice
        </p>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Success Message - show after submission across tabs */}
        {reportResult && (
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: 'rgba(21, 128, 61, 0.2)',
              border: '1px solid rgba(132, 204, 22, 0.5)',
              borderRadius: '12px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <Info size={20} style={{ marginTop: '4px', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: '600', margin: '0 0 4px 0' }}>Report Submitted Successfully!</p>
              {reportResult.aiAnalysis && (
                <p style={{ fontSize: '14px', opacity: 0.9, margin: '0 0 4px 0' }}>
                  Model prediction: <strong>{reportResult.aiAnalysis.prediction || 'unknown'}</strong>
                  {reportResult.aiAnalysis.species &&
                    ` (${reportResult.aiAnalysis.species})`}<br />
                  Confidence: <strong>{(reportResult.aiAnalysis.confidence ?? 0).toFixed(2)}</strong>
                  {reportResult.aiAnalysis.snake_count != null &&
                    ` • Count: ${reportResult.aiAnalysis.snake_count}`}
                </p>
              )}
              <p style={{ fontSize: '14px', opacity: 0.9, margin: '0' }}>
                {reportResult.nearbyHospitals?.length > 0 
                  ? `Found ${reportResult.nearbyHospitals.length} nearby hospitals with anti-venom.`
                  : 'Emergency services have been notified.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'report' && (
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            <ReportForm onSubmitSuccess={handleReportSuccess} />
          </div>
        )}

        {activeTab === 'analyzer' && <ImageAnalyzer />}

        {activeTab === 'map' && <HeatMap />}

        {activeTab === 'hospitals' && <HospitalLocator />}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '64px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(5, 46, 22, 0.5)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#999', fontSize: '14px' }}>
              <Shield size={20} />
              <span>© 2026 SylvanGuard. Protecting lives from wildlife emergencies.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#999', cursor: 'pointer', textDecoration: 'none' }}>
                <Github size={20} />
              </a>
              <span style={{ color: '#999', fontSize: '14px' }}>Built with ❤️ for community safety</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
