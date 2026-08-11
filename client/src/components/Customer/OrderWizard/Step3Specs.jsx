import React from 'react';

export const Step3Specs = ({ selectedServices = [], specifications, setSpecifications }) => {
  // LOOP 24: CONDITIONAL RENDERING CHECK FOR LED WALL SERVICES
  const hasLedWall = (selectedServices || []).some(
    (s) => s?.category === 'DISPLAY' || s?.name?.toUpperCase().includes('LED')
  );

  const isOutstation = Number(specifications?.transportDistanceKm || 0) > 25;

  return (
    <div>
      <h2 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 28px 0', color: 'var(--text-primary)' }}>
        Step 3: Equipment & Distance Specifications
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Render LED Dimensions ONLY if an LED Wall / Display Service is Selected */}
        {hasLedWall && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                LED Wall Width (Feet)
              </label>
              <input
                type="number"
                value={specifications.ledWidthFeet}
                onChange={(e) => setSpecifications({ ...specifications, ledWidthFeet: Number(e.target.value) })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                LED Wall Height (Feet)
              </label>
              <input
                type="number"
                value={specifications.ledHeightFeet}
                onChange={(e) => setSpecifications({ ...specifications, ledHeightFeet: Number(e.target.value) })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              />
            </div>
          </div>
        )}

        {/* Distance Field Always Rendered */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Distance from Studio (KM)
          </label>
          <input
            type="number"
            value={specifications.transportDistanceKm}
            onChange={(e) => setSpecifications({ ...specifications, transportDistanceKm: Number(e.target.value) })}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '16px',
              fontWeight: '500',
            }}
          />
        </div>

        {/* Outstation Notice Banner */}
        {isOutstation && (
          <div
            style={{
              backgroundColor: 'rgba(201, 122, 19, 0.15)',
              border: '1px solid #C97A13',
              color: '#C97A13',
              padding: '16px 20px',
              borderRadius: '14px',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '24px' }}>🚚</span>
            <span>
              <strong>Outstation Venue Notice ({specifications.transportDistanceKm} km):</strong> This venue is outside standard local delivery range (&gt; 25 km). Final transport fuel charges will be set by Admin in your quotation.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
